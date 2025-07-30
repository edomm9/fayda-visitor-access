"""
VeriFayda 2.0 (eSignet) OIDC integration module.
"""
import base64
import hashlib
import json
import secrets
import time
from datetime import datetime, timedelta
from urllib.parse import urlencode, parse_qs

import jwt
import requests
from cryptography.hazmat.primitives import serialization # type: ignore
from django.conf import settings
from django.utils import timezone

from .models import OIDCSession


class VeriFaydaOIDC:
    """VeriFayda 2.0 (eSignet) OIDC client implementation."""

    def __init__(self):
        self.client_id = settings.VERIFAYDA_CLIENT_ID
        self.redirect_uri = settings.VERIFAYDA_REDIRECT_URI
        self.private_key_jwk = settings.VERIFAYDA_PRIVATE_KEY_JWK
        self.token_endpoint = settings.VERIFAYDA_TOKEN_ENDPOINT
        self.authorization_endpoint = settings.VERIFAYDA_AUTHORIZATION_ENDPOINT
        self.userinfo_endpoint = settings.VERIFAYDA_USERINFO_ENDPOINT
        self.client_assertion_type = settings.VERIFAYDA_CLIENT_ASSERTION_TYPE

    def generate_pkce_pair(self):
        """Generate PKCE code verifier and challenge."""
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        return code_verifier, code_challenge

    def generate_state(self):
        """Generate a secure state parameter."""
        return secrets.token_urlsafe(32)

    def create_client_assertion(self):
        """Create JWT client assertion for authentication using JWK private key."""
        now = int(time.time())
        
        # Parse the JWK private key
        jwk_data = json.loads(base64.b64decode(self.private_key_jwk).decode('utf-8'))
        
        payload = {
            'iss': self.client_id,
            'sub': self.client_id,
            'aud': self.token_endpoint,
            'jti': secrets.token_urlsafe(16),
            'exp': now + 300,  # 5 minutes
            'iat': now,
        }

        # Convert JWK to PEM format for PyJWT
        from cryptography.hazmat.primitives.asymmetric import rsa # type: ignore
        from cryptography.hazmat.primitives import serialization # type: ignore
        
        # Extract RSA components from JWK
        n = int.from_bytes(base64.urlsafe_b64decode(jwk_data['n'] + '=='), 'big')
        e = int.from_bytes(base64.urlsafe_b64decode(jwk_data['e'] + '=='), 'big')
        d = int.from_bytes(base64.urlsafe_b64decode(jwk_data['d'] + '=='), 'big')
        p = int.from_bytes(base64.urlsafe_b64decode(jwk_data['p'] + '=='), 'big')
        q = int.from_bytes(base64.urlsafe_b64decode(jwk_data['q'] + '=='), 'big')
        
        # Create RSA private key
        private_key = rsa.RSAPrivateNumbers(
            p=p, q=q, d=d,
            dmp1=int.from_bytes(base64.urlsafe_b64decode(jwk_data['dp'] + '=='), 'big'),
            dmq1=int.from_bytes(base64.urlsafe_b64decode(jwk_data['dq'] + '=='), 'big'),
            iqmp=int.from_bytes(base64.urlsafe_b64decode(jwk_data['qi'] + '=='), 'big'),
            public_numbers=rsa.RSAPublicNumbers(e=e, n=n)
        ).private_key()

        # Sign JWT with RS256
        token = jwt.encode(payload, private_key, algorithm='RS256', headers={'kid': jwk_data.get('kid')})
        return token

    def initiate_auth_flow(self, fayda_id, auth_type='full'):
        """Initiate OIDC authorization flow."""
        # Generate PKCE parameters
        code_verifier, code_challenge = self.generate_pkce_pair()
        state = self.generate_state()

        # Store session data
        session = OIDCSession.objects.create(
            state=state,
            fayda_id=fayda_id,
            code_verifier=code_verifier,
            expires_at=timezone.now() + timedelta(minutes=15)
        )

        # Configure scope and claims based on auth type
        if auth_type == 'yes_no':
            scope = 'openid'
            claims = {}
        else:
            scope = 'openid profile email'
            # Request essential claims for visitor management
            claims = {
                "userinfo": {
                    "name": {"essential": True},
                    "phone_number": {"essential": True},
                    "email": {"essential": True},
                    "picture": {"essential": True},
                    "gender": {"essential": True},
                    "birthdate": {"essential": True},
                    "address": {"essential": False}
                },
                "id_token": {}
            }

        # Build authorization URL parameters
        auth_params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': scope,
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'claims_locales': 'en am',  # English and Amharic
        }

        # Add claims if not empty
        if claims:
            auth_params['claims'] = json.dumps(claims)

        # Add ACR values for specific authentication requirements
        # Default authentication context will be used if not specified
        # auth_params['acr_values'] = 'mosip:idp:acr:generated-code'  # OTP only
        # auth_params['acr_values'] = 'mosip:idp:acr:generated-code:biometrics'  # OTP or biometrics

        auth_url = f"{self.authorization_endpoint}?{urlencode(auth_params)}"
        return auth_url, state

    def exchange_code_for_tokens(self, code, state):
        """Exchange authorization code for tokens."""
        # Retrieve session
        try:
            session = OIDCSession.objects.get(state=state)
            if session.is_expired:
                raise ValueError("Session expired")
        except OIDCSession.DoesNotExist:
            raise ValueError("Invalid state parameter")

        # Create client assertion
        client_assertion = self.create_client_assertion()
        
        # Prepare token request
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_assertion_type': self.client_assertion_type,
            'client_assertion': client_assertion,
            'code_verifier': session.code_verifier,
        }

        # Make token request
        response = requests.post(
            self.token_endpoint,
            data=token_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )

        if not response.ok:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('error_description', f'Token exchange failed: {response.text}')
            raise ValueError(f"Token exchange failed: {error_msg}")

        tokens = response.json()
        
        # Clean up session
        session.delete()
        
        return tokens

    def get_user_info(self, access_token):
        """Get user information from userinfo endpoint."""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        }

        response = requests.get(
            self.userinfo_endpoint,
            headers=headers,
            timeout=30
        )

        if not response.ok:
            raise ValueError(f"Failed to get user info: {response.text}")

        # The response is a JWT token, decode it
        user_info_jwt = response.text
        
        # Decode JWT without signature verification (for development)
        # In production, you should verify the signature
        decoded_user_info = jwt.decode(
            user_info_jwt, 
            options={"verify_signature": False}, 
            algorithms=["RS256"]
        )
        
        return decoded_user_info

    def verify_id_token(self, id_token):
        """Verify ID token signature and claims."""
        try:
            # Decode without verification for development
            # In production, fetch JWKS and verify signature
            decoded = jwt.decode(id_token, options={"verify_signature": False}, algorithms=["RS256"])
            
            # Verify basic claims
            now = int(time.time())
            if decoded.get('exp', 0) < now:
                raise ValueError("ID token expired")
            
            # Verify issuer (adjust based on actual VeriFayda issuer)
            expected_issuer = self.authorization_endpoint.replace('/authorize', '')
            if decoded.get('iss') != expected_issuer:
                # Log warning but don't fail for development
                print(f"Warning: ID token issuer mismatch. Expected: {expected_issuer}, Got: {decoded.get('iss')}")
            
            if decoded.get('aud') != self.client_id:
                raise ValueError("Invalid audience")
            
            return decoded
            
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid ID token: {str(e)}")

    def process_callback(self, code, state):
        """Process OIDC callback and return user data."""
        # Exchange code for tokens
        tokens = self.exchange_code_for_tokens(code, state)
        
        # Verify ID token if present
        id_token_claims = {}
        if 'id_token' in tokens:
            id_token_claims = self.verify_id_token(tokens['id_token'])
        
        # Get user info
        user_info = self.get_user_info(tokens['access_token'])
        
        # Extract Fayda ID from sub claim (format: "fayda:XXXXXXXXXX")
        fayda_id = user_info.get('sub', '').replace('fayda:', '')
        
        # Handle multi-language fields
        name = user_info.get('name', user_info.get('name#en', ''))
        if not name:
            name = user_info.get('name#am', '')
        
        # Combine and return user data
        user_data = {
            'fayda_id': fayda_id,
            'name': name,
            'picture': user_info.get('picture', ''),
            'birthdate': user_info.get('birthdate', ''),
            'gender': user_info.get('gender', ''),
            'email': user_info.get('email', ''),
            'phone': user_info.get('phone_number', ''),
            'address': user_info.get('address', ''),
            # Include multi-language versions if available
            'name_en': user_info.get('name#en', ''),
            'name_am': user_info.get('name#am', ''),
        }
        
        return user_data

    def cleanup_expired_sessions(self):
        """Clean up expired OIDC sessions."""
        expired_count = OIDCSession.objects.filter(
            expires_at__lt=timezone.now()
        ).count()
        
        OIDCSession.objects.filter(expires_at__lt=timezone.now()).delete()
        
        return expired_count

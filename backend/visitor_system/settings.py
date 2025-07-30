"""
Django settings for visitor_system project.
"""

import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-change-me-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'visitor_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'visitor_system.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'visitor_system.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# CORS settings
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# VeriFayda OIDC Configuration
VERIFAYDA_CLIENT_ID = config('CLIENT_ID', default='GCE-a3iRabzdfqh17DH8LaxhhZKvtarwHc1X3H6mn1k')
VERIFAYDA_REDIRECT_URI = config('REDIRECT_URI', default='http://localhost:3000/callback')
VERIFAYDA_PRIVATE_KEY_JWK = config('PRIVATE_KEY_JWK', default='ewogICJrdHkiOiAiUlNBIiwKICAidXNlIjogInNpZyIsCiAgImtleV9vcHMiOiBbCiAgICAic2lnbiIKICBdLAogICJhbGciOiAiUlMyNTYiLAogICJraWQiOiAiMGIxOTRkZjQtNzE0OS00MTQ2LTk3YzUtNzhmZGYwZDRmYjFkIiwKICAiZCI6ICJhcFhneVlZSno3RUdZdGQ4bVF6dXgxMl90d2RfdHdUY1pwSzJnRzhUd29MYlVkX0dmc3J2VXlUYzYyUk1EdU43d0RIbHFyWWVQTHBtS25LWDJKYjE5U1hFa1Nvanp0c3dSOF9EdVYwTE9QZkpQb3JPVTd3MFdLMHJjX3pXM3VURTJ3Ti01Nm5DQnhLcE41ZnZSWDRyYkhsazlFSTZFNTRtS1VWUzl6T3pQdGRiTjc3OEY2U3haMl9kc2FTQUhKMzZqWlpRUFRUdmZRb0Z5UzlzSTJOVDlkbGpvVm1PMk1xVEZ2ZG5VY0RQWng4ajFIQzFmWWNFU2NsV2VURFNpRWFuX293RE9UVjdPLXFCb2h3N0pGd2tScTNVeC1oSjFKMHdlaEJsbGZVVnB3cjI1aElxNXBKUlF4cnZucVU3SHdqU2xuSmpfQjFLSFdCdk9WOUdyUUZfWFEiLAogICJuIjogIjRPd0s1SEk2QVFtS3ZkeGt5S29xX1d1UFcyVl9vcWtaNkVjSDZSQjd5bVJ3cDhteXFRVFR4LVlfejcwZ3Z6d1o1YUNyQ0JqVi10WThXckk1cDBENjg3aEFEbDEtQ2ttTHFHQjVCR016bXd3c0wzYS1lZlhOMVBXSFBhR3FYR0IxUDBueGl3TVJaMTZKcHhOSWtqWGdOajcyd0tob2VKVEFpVUpGbWE5RFdyQ2FxMlJ1ZWVDWWVKNnBqVmdYcEpWNUtOMzFFQUhoRHZMUDZEbk4zd3h6NnlOcTBBNjBQeFRLcmpHdzhUYzlqN18tT3pwSUV1Y3A2T3p0ZEg0c2o0QURSRWtBUWtYNktZV0c1SE9nWldyUWpaemF1MDlPOEVsa2hPZDFNdE9zVEZiRmdyTXBkamR1OFdoSGprVlp6Yk5hd0IwNFBra3Q2VkYtNU5EMktGWWx6dyIsCiAgImUiOiAiQVFBQiIsCiAgInAiOiAiLVB3R01xTzU1TjNwcmFGTjhrNmdmSEhEajBpRllQS3BvNVpBN1JqNEpZQmpybmlEcXJnN1ItaE53NlhFM2tXQ1hJNjZXLXI2aVFrb186SE9uU3IyZW0wTjU2Rm9zY3ZXMFhhSG5CbkRkQXVHUm9LUDQzcW16OG5zeDJTWjlKZmZNN0o1QjFvODk1RmhUTHA4ZXFLTkVlS3BpV3Y2bGR4M0txSFZnOGZqN0cwIiwKICAicSI6ICI1MEp6ZldBNlhueFJHQVN6Z21jaGI3V1JINTlmenhWSmt3ajNTZF9EMFlJOEVNLUFwanlIOG1tTU5fZVZ5cEhTcmJFSFo5cHJTTVVjUmZxRC1TUlNpT1NFd1BoVmJ3Zmc3X0VQeE5YeDVkOGxxZ0dOUUNyNVBEWGRCd2lYMEt3TXlpcXBNMEM2YWtYX2lfMmRmWlRFb2VkMmx0RlhIcFp1MDZKOGNBZC1mYXMiLAogICJkcCI6ICJ4SGNSYU9uNmFGYVc2bFFLem5VdWU2UEZIUTJyZVZsaGRGeS1kSmdzVG1NbHhPa0JkRGVWUjJOTjRXQ3ZuSGdhcW5CUkt2Q2Fxb0VZNFcxcXpHZTNQOWxIakl1M3NmdlhVVWNITUt5X3BwVGxha1BoeUN6aTdiazI1Z3RDMUZiMlg3T25mcDY4MXRqWGZ4VHoza3pmcGNwRjN0TGVVMXc0aC1KVk9Yd0VKRzAiLAogICJkcSI6ICJpX3lPbWt0QXFlZEkwMmd0SFhlLUpyZmF4RENlTjJWa1p3dmJYUzJGaEhINFdCaXpnRzFOd2JDZ2YxUndxUEdDZlQtWEF3ZVZQN1NKZTlhOFFuajVPUUpUVmRnOUp2dTI3cWVXYXdreTUzb2ZlM3g2LTJmSF9PbUNCUHJ2b3hJeW44SVpMX3d6bTVjSnJMejFzNG4xU1NncWdmcndhSVNaUzZTa19NLWNnd2MiLAogICJxaSI6ICJVbjZwWVZDMTZJZk5FLVlhaUtjNmZFRTZkZnZZWm4xOWdOb2JERmI2VFcxV1A0T0xac3IzdlVYREptajNfYm0yR19QOVNGbGdzNWZ6UUpLUDd5RTdDTjNlWmxmaHMzUE8tc3NWbDZrSGg1dTVtLWp2Q0R1OGo1dFl5c3FvRXFIV3RqMUI1VGNzSGxvOWkwTFl5dThkT3ViV1cxa0pmSWtteXFyb3pSa0NhZEkiCn0=')
VERIFAYDA_TOKEN_ENDPOINT = config('TOKEN_ENDPOINT', default='https://esignet.ida.fayda.et/v1/esignet/oauth/v2/token')
VERIFAYDA_AUTHORIZATION_ENDPOINT = config('AUTHORIZATION_ENDPOINT', default='https://esignet.ida.fayda.et/authorize')
VERIFAYDA_USERINFO_ENDPOINT = config('USERINFO_ENDPOINT', default='https://esignet.ida.fayda.et/v1/esignet/oidc/userinfo')
VERIFAYDA_CLIENT_ASSERTION_TYPE = config('CLIENT_ASSERTION_TYPE', default='urn:ietf:params:oauth:client-assertion-type:jwt-bearer')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'visitor_system.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'visitor_app': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

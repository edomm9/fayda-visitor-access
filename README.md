# Fayda Visitor Access System

The prototype is **hosted at**:  
🔗 [https://v0-fayda-visitor-access.vercel.app/](https://v0-fayda-visitor-access.vercel.app/)


A comprehensive visitor management system built with vanilla HTML, CSS, and JavaScript, designed for institutional use with plans for VeriFayda 2.0 (eSignet) integration for secure identity verification.

## 🏢 Overview

The Fayda Visitor Access System is a modern, accessible web application that streamlines visitor management for institutions. It provides a complete solution for visitor check-in/check-out, identity verification, and administrative oversight.

# Fayda Visitor Access System

## Contributors
- Edom Mulugeta  
- Gelila Nebiyu  
- Selome Gebregiorgis  

---

## Project Synopsis

### Problem Statement
Government offices and institutions often rely on **manual logbooks** to record visitors. This approach is:

- Inefficient  
- Insecure  
- Prone to errors and impersonation  

---

### Planned Solution
We are building a **digital check-in system** that allows visitors to log their entry using their **Fayda ID**.  
The system will:

- Verify identity via Fayda  
- Log the visit details:
  - Name  
  - Timestamp  
  - Person being visited  
  - Reason for visit  

---

### Expected Outcome
A working prototype that:

- Allows **secure check-ins and check-outs** via Fayda ID  
- **Stores visit logs** and provides a **dashboard** with:
  - Viewable logs  
  - Basic analytics  
- Optionally **notifies the host** being visited  
- Supports future extensions such as:
  - **QR codes**  
  - Advanced **analytics**  

---

### Fayda’s Role
Fayda will serve as the **digital identity layer**, verifying visitors and ensuring that entries are:

- Tied to a **real, authenticated person**  
- Secured and trustworthy  
- Logged for **accountability**  

> **Technology Integration**:  
> This system will utilize **Fayda ID authentication** and **VeriFayda 2.0 (eSignet)** via **OIDC integration** to power secure and seamless visitor access.

---

## Summary
A comprehensive **visitor management system** for **secure facilities**, enhanced by **Fayda ID authentication** and **VeriFayda 2.0**, promoting trust, security, and operational efficiency.


### Key Features

- **Secure Authentication**: Multi-role user authentication (Admin, Guard, Security)
- **Visitor Check-In/Out**: Streamlined visitor registration with photo verification
- **Photo ID Verification**: Automatic photo display for identity confirmation
- **Real-time Dashboard**: Live statistics and visitor activity monitoring
- **Comprehensive Logging**: Detailed visitor logs with search and filtering
- **System Management**: Host management, settings, and data export
- **Dark/Light Theme**: User-preferred theme switching
- **Responsive Design**: Mobile-first design for all devices
- **Accessibility**: WCAG compliant with screen reader support

## Current Implementation

### Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage (temporary solution)
- **Architecture**: Modular JavaScript with separation of concerns
- **Styling**: CSS Custom Properties with theme support
- **Icons**: Unicode emojis and CSS-based icons

### Current Features

#### 1. Authentication System
- **Multi-role Support**: Admin, Guard, Security roles
- **Session Management**: Persistent login with localStorage
- **Demo Credentials**: 
  - `admin / admin123`
  - `guard / guard123`
  - `security / security123`

#### 2. Visitor Management
- **Dual Interface**: Tabbed check-in/check-out on single page
- **Photo Verification**: Automatic photo display for valid Fayda IDs
- **Real-time Validation**: Instant feedback for form inputs
- **Status Tracking**: Complete visitor lifecycle management

#### 3. Administrative Features
- **Live Dashboard**: Real-time visitor statistics and activity
- **Comprehensive Logs**: Searchable visitor history with pagination
- **Host Management**: Dynamic host list management
- **Data Export**: CSV export functionality
- **System Settings**: Theme, notifications, and preferences

#### 4. User Experience
- **Modern UI**: Clean, professional institutional design
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Theme Support**: Light/dark mode with system preference detection

## Backend Integration: VeriFayda 2.0 (eSignet)

### Integration Overview

The system is designed for seamless integration with **VeriFayda 2.0** using **eSignet** (OpenID Connect) for secure identity verification and authentication.

### Planned Integration Features

#### 1. Identity Verification
- **Real-time ID Verification**: Direct integration with Fayda ID database
- **Biometric Authentication**: Support for OTP and biometric verification
- **Photo Retrieval**: Automatic photo fetching from official Fayda records
- **Multi-language Support**: Amharic and English language support

#### 2. Authentication Flow
\`\`\`
User Input Fayda ID → VeriFayda 2.0 Verification → Photo & Data Retrieval → Check-in Process
\`\`\`

#### 3. eSignet OIDC Integration Points

##### Authorization Request
\`\`\`javascript
// Planned implementation
const authUrl = `${ESIGNET_AUTH_ENDPOINT}/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${CALLBACK_URL}&` +
  `scope=openid profile email&` +
  `state=${generateState()}&` +
  `code_challenge=${codeChallenge}&` +
  `acr_values=mosip:idp:acr:generated-code&` +
  `claims_locales=en am&` +
  `claims=${encodeURIComponent(JSON.stringify(claims))}`;
\`\`\`

##### User Data Claims
\`\`\`javascript
const claims = {
  "userinfo": {
    "name": {"essential": true},
    "phone_number": {"essential": true},
    "email": {"essential": true},
    "picture": {"essential": true},
    "gender": {"essential": true},
    "birthdate": {"essential": true},
    "address": {"essential": true}
  },
  "id_token": {}
};
\`\`\`

##### Token Exchange
\`\`\`javascript
// Planned token exchange implementation
const tokenResponse = await fetch(`${ESIGNET_TOKEN_ENDPOINT}/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: CALLBACK_URL,
    client_id: CLIENT_ID,
    client_assertion: signedJWT,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    code_verifier: codeVerifier
  })
});
\`\`\`

### Backend Architecture Plan

#### 1. API Endpoints
\`\`\`
POST /api/auth/login          # User authentication
POST /api/visitors/checkin    # Visitor check-in with VeriFayda verification
POST /api/visitors/checkout   # Visitor check-out
GET  /api/visitors           # Retrieve visitor logs
GET  /api/visitors/stats     # Dashboard statistics
POST /api/verifayda/verify   # VeriFayda ID verification
GET  /api/verifayda/photo    # Retrieve user photo
\`\`\`

#### 2. Database Schema (Planned)
\`\`\`sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitors table
CREATE TABLE visitors (
  id UUID PRIMARY KEY,
  fayda_id VARCHAR(12) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  photo_url VARCHAR(500),
  person_to_visit VARCHAR(255) NOT NULL,
  reason_for_visit TEXT NOT NULL,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'checked-in',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hosts table
CREATE TABLE hosts (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### 3. Security Considerations
- **JWT Token Management**: Secure token storage and refresh
- **PKCE Implementation**: Code challenge/verifier for OAuth security
- **Client Assertion**: JWT-based client authentication
- **Rate Limiting**: API rate limiting for security
- **Data Encryption**: Sensitive data encryption at rest and in transit

## Usage

### For Visitors
1. **Check-In**: Enter your 12-digit Fayda ID
2. **Verify Identity**: Confirm your photo and details
3. **Complete Form**: Select host and provide visit reason
4. **Check-Out**: Use the same interface to check out

### For Staff
1. **Login**: Use provided credentials
2. **Monitor**: View real-time dashboard
3. **Manage**: Search and filter visitor logs
4. **Configure**: Adjust settings and manage hosts

## 🔧 Configuration

### Theme Customization
Modify CSS custom properties in `styles/main.css`:
\`\`\`css
:root {
  --primary-color: #2c5aa0;
  --secondary-color: #27ae60;
  --accent-color: #e74c3c;
  /* ... other variables */
}
\`\`\`

### Adding New Hosts
Use the Settings page or modify the default hosts in `js/modules/app.js`:
\`\`\`javascript
const defaultHosts = [
  "Dr. Ahmed Hassan - Medical Director",
  "Ms. Fatima Al-Zahra - HR Manager",
  // Add new hosts here
];
\`\`\`

## System Requirements

### Minimum Requirements
- **Browser**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **JavaScript**: ES6+ support required
- **Storage**: 5MB local storage space
- **Network**: Internet connection for future VeriFayda integration

### Recommended Requirements
- **Browser**: Latest version of modern browsers
- **Device**: Desktop, tablet, or mobile device
- **Screen**: Minimum 320px width
- **Network**: Stable internet connection

---


*This system is designed to integrate with Ethiopia's national digital identity infrastructure through VeriFayda 2.0, providing secure and efficient visitor management for government and private institutions.*

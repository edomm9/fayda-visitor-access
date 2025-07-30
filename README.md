# Fayda Visitor Access System

## Contributors:
- Edom Mulugeta
- Gelila Nebiyu
- Selome Gebregiorgis

---
## Project Synopsis

### Problem Statement
Government offices and institutions often use manual logbooks to record visitors. This approach is inefficient, insecure, and prone to errors and impersonation.

### Planned Solution
We are building a digital check-in system that allows visitors to log their entry using their Fayda ID. The system will verify the identity via Fayda and log the visit (name, timestamp, person being visited, and reason).

### Expected Outcome
A working prototype that:
- Allows secure check-ins and check-outs via Fayda ID
- Stores visit logs along with a dashboard to view logs along with analytics
- Optionally notifies the host being visited
- Supports future extensions like QR codes or analytics

### Fayda’s Role
Fayda will serve as the **digital identity layer** to verify visitors and ensure entries are tied to a real, authenticated person. This adds a layer of trust and accountability to visitor access.

---
A comprehensive visitor management system for secure facilities using **Fayda ID authentication** and **VeriFayda 2.0 (eSignet) OIDC integration**.

## Architecture

- **Frontend**: Vanilla HTML, CSS, JavaScript 
- **Backend**: Django REST API 
- **Authentication**: VeriFayda 2.0 (eSignet) OIDC with PKCE flow
- **Database**: SQLite (development) / PostgreSQL (production)

## Features

### Core Functionality
- **Visitor Check-In**: Fayda ID authentication with VeriFayda 2.0 OIDC
- **Visitor Check-Out**: Quick checkout process with visit duration tracking
- **Admin Dashboard**: Real-time statistics, visitor logs, and reporting
- **Host Management**: Add/edit people who can receive visitors

### Security Features
- OIDC Authorization Code Flow with PKCE
- JWT client assertion with RS256 signing using JWK private key
- Secure session management with expiration
- CORS protection and CSRF mitigation

### User Experience
- Responsive design for tablet/kiosk displays
- Accessible HTML5 with ARIA support
- Professional government-style UI
- Real-time form validation
- Multi-language support (English/Amharic)

## Installation and Deployment

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- VeriFayda 2.0 (eSignet) OIDC credentials
- Git

### Backend Setup (Local Development)

1. **Clone the repository**:
   \`\`\`bash
   git clone <your-repo-url>
   cd fayda-visitor-system/backend
   \`\`\`

2. **Create virtual environment**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. **Install dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Environment configuration**:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

5. **Database setup**:
   \`\`\`bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   \`\`\`

6. **Run development server**:
   \`\`\`bash
   python manage.py runserver
   \`\`\`

   The API will be available at `http://localhost:8000/api/`

### Frontend Setup (Local Development)

1. **Navigate to frontend directory**:
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Update API endpoints** (if needed):
   - Edit JavaScript files to point to your backend URL
   - For local development, the default `http://localhost:8000/api` should work

3. **Serve locally using Python**:
   \`\`\`bash
   python -m http.server 8080
   \`\`\`

   The frontend will be available at `http://localhost:3000`


### Test Credentials

For testing with VeriFayda staging environment:

- **Test FAN**: 3126894653473958
- **Test FIN**: 6140798523917519  
- **Test FIN3**: 6230247319356120
- **OTP**: 111111

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Basic login (stub)
- `POST /api/oidc/initiate/` - Initiate VeriFayda OIDC flow
- `POST /api/oidc/callback/` - Handle VeriFayda OIDC callback

### Visitor Management
- `POST /api/checkin/` - Check in visitor
- `POST /api/checkout/find-active/` - Find active visit
- `POST /api/checkout/` - Check out visitor
- `POST /api/checkout/force/` - Force checkout (admin)

### Host Management
- `GET /api/hosts/` - List hosts
- `POST /api/hosts/` - Create host
- `GET /api/hosts/{id}/` - Get host details
- `PUT /api/hosts/{id}/` - Update host
- `DELETE /api/hosts/{id}/` - Delete host

### Dashboard & Reporting
- `GET /api/dashboard/stats/` - Get dashboard statistics
- `GET /api/visitor-logs/` - List visitor logs (with filtering)
- `GET /api/visitor-logs/export/` - Export logs as CSV

### Logs and Monitoring

- **Backend logs**: Check Django logs in container or `/app/visitor_system.log`
- **Frontend errors**: Use browser developer console
- **API monitoring**: Use Django admin interface
- **VeriFayda integration**: Check network tab for OIDC requests

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with ❤️ for secure visitor management using VeriFayda 2.0**

# Project Title: Fayda Visitor Access System

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
- Allows secure check-ins via Fayda ID
- Stores visit logs
- Optionally notifies the host being visited
- Supports future extensions like QR codes or analytics

### Fayda’s Role
Fayda will serve as the **digital identity layer** to verify visitors and ensure entries are tied to a real, authenticated person. This adds a layer of trust and accountability to visitor access.

---

## 🧰 Tech Stack

- **Frontend:** React.js (or plain HTML + JS)
- **Backend:** FastAPI (Python) or Node.js
- **Database:** SQLite (lightweight) or Supabase
- **Auth/Identity:** VeriFayda OIDC (mock or real)
- **Deployment:** Render / Vercel / GitHub Pages / Local server

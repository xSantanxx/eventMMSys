# Event Creation and Login System

A full-stack web application designed to streamline event management by replacing manual spreadsheets with automated registration, QR code generation, and real-time check-in tracking.

## 🚀 Overview

This system provides a seamless end-to-end workflow for event organizers and attendees. Organizers can create events and monitor attendance in real-time, while attendees receive instant confirmation and unique QR codes for rapid entry.

### Key Features
* **Custom Event Creation:** Easily set up event details and registration forms.
* **QR Code Workflow:** Automated generation of unique QR codes upon registration and an integrated webcam scanner for instant check-ins.
* **Real-time Analytics:** A live dashboard tracking attendee metrics using WebSockets.
* **Automated Communication:** Integration with SendGrid for immediate email confirmations containing registration QR codes.

---

## 🛠️ Tech Stack

**Frontend:**
* **React.js:** For building a responsive and interactive user interface.
* **React-QR-Reader:** To implement the front-end webcam scanning functionality.

**Backend:**
* **Node.js & Express:** Powering the RESTful API and business logic.
* **PostgreSQL:** Relational storage for event and attendee data.

**Integrations:**
* **NodeMailer:** API for automated transactional emails.

---

## 📂 Project Structure

```text
event-flow/
├── frontEnd/screen/              # React Frontend
│   ├── src/
|         ├── Event.jsx           # React component for event details
|         ├── RegistrationSys.jsx # React component for registration
|         ├── App.jsx             # Client-side routing and layout
│         └── Sign.jsx            # React component for signing in
├── backEnd/                      # Node.js/Express Backend
│   ├── db.js                     # Database configurations
│   ├── routes/                   # API endpoints (POST /register, GET /events)
│   └── event.js                  # Logic for event, attendee management, QR generation, API endpoints (POST /register, GET /events) & Email logic
└── README.md

# Event Creation and Login System

A full-stack event management app for creating events, registering attendees, sending QR code confirmation emails, and checking guests in with a live camera scanner.

## Features

- **Organizer auth** — register/login with JWT; events are owned by the logged-in organizer
- **Event hub** — view your events and create new ones from a single dashboard
- **Event details** — see description, date, registration count, and check-in count
- **Attendee registration** — validated signup form with email confirmation (public)
- **QR code emails** — unique QR code generated per attendee and sent on registration
- **QR check-in** — staff (authenticated) scan codes to mark attendees as checked in
- **Health checks** — backend reports database and email provider status

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js, Express 5, express-validator, JWT + bcrypt |
| Database | PostgreSQL (Supabase) |
| Email | Resend (production) or Gmail via Nodemailer (local dev) |
| QR | `qrcode`, `@yudiel/react-qr-scanner` |

## Project Structure

```text
eventMMSys/
├── backEnd/
│   ├── event.js              # Express API server
│   ├── auth.js               # JWT helpers + password hashing
│   ├── db.js                 # PostgreSQL connection pool
│   ├── mail.js               # Email delivery (Resend / Gmail)
│   ├── schema.sql            # Fresh-install schema
│   ├── schema_supabase.sql   # Safe migration for existing Supabase DBs
│   └── package.json
├── frontEnd/screen/
│   ├── src/
│   │   ├── App.jsx               # Auth gate + event list + create event modal
│   │   ├── Event.jsx             # Event detail page
│   │   ├── RegistrationSys.jsx   # Attendee registration
│   │   ├── Sign.jsx              # QR scanner check-in
│   │   ├── api/client.js         # API URL + auth helpers
│   │   └── components/           # Shared UI (Layout, Card, Button, Modal, FormField)
│   ├── vercel.json               # SPA routing for Vercel
│   └── package.json
└── README.md
```

## Database Schema

Prefer running `backEnd/schema_supabase.sql` in the Supabase SQL Editor (handles existing tables). Fresh installs can use `backEnd/schema.sql`.

Core tables: `organizers`, `events` (with `organizer_id`), `attendees`.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/health` | No | Server, database, and email status |
| `POST` | `/auth/register` | No | Create organizer account |
| `POST` | `/auth/login` | No | Log in; returns JWT |
| `GET` | `/auth/me` | Yes | Current organizer |
| `GET` | `/getEvents` | Yes | List your events |
| `POST` | `/addEvent` | Yes | Create a new event |
| `GET` | `/:id` | No | Get event by ID |
| `POST` | `/:id/register` | No | Register an attendee and send QR email |
| `POST` | `/:id/signin` | Yes | Check in via QR token (owner only) |

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)

### 1. Database

Run `backEnd/schema_supabase.sql` (or `schema.sql`) in your Postgres / Supabase SQL editor.

### 2. Backend

```bash
cd backEnd
npm install
```

Create `backEnd/.env` (see also `.env.example`):

```env
PORT=3000

# Option A: Supabase / hosted Postgres
DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:5432/postgres
DATABASE_SSL=true

# Option B: Local Postgres
# dbUser=postgres
# dbPass=your_password
# dbHost=localhost
# dbPort=5432
# db=eventSys

JWT_SECRET=replace_with_a_long_random_string
JWT_TTL=7d

# Email — local dev (Gmail app password, no spaces)
userEm=your_email@gmail.com
userPass=your_gmail_app_password

# Optional: production-style email locally
# RESEND_API_KEY=re_xxxxxxxx
# RESEND_FROM=Event System <onboarding@resend.dev>

FRONTEND_URL=http://localhost:5173
```

Start the API:

```bash
npm start
```

### 3. Frontend

```bash
cd frontEnd/screen
npm install
```

Create `frontEnd/screen/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`, register an organizer, then create events.

## Deployment

### Backend (Render)

- **Root directory:** `backEnd`
- **Build command:** `npm install`
- **Start command:** `npm start`

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Postgres connection string |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | Long random string for signing tokens |
| `RESEND_API_KEY` | Resend API key (required on Render — SMTP is blocked) |
| `RESEND_FROM` | Sender address, e.g. `Event System <onboarding@resend.dev>` |
| `FRONTEND_URL` | Your Vercel frontend URL |

> **Note:** Render blocks outbound SMTP ports, so Gmail/Nodemailer will time out in production. Use Resend instead.

### Frontend (Vercel)

- **Root directory:** `frontEnd/screen`
- **Build command:** `npm run build`
- **Output directory:** `dist`

**Environment variable:**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Render backend URL, e.g. `https://your-api.onrender.com` |

### Database (Supabase)

1. Create a Supabase project
2. Run `backEnd/schema_supabase.sql` in the SQL editor
3. Copy the connection string into `DATABASE_URL` on Render

## User Flow

1. Organizer registers/logs in and creates an event
2. Attendees open the event page and register with name + email
3. Backend saves the attendee, generates a QR token, and emails the QR code
4. At the event, the organizer opens Sign In and scans the attendee's QR code
5. Backend marks the attendee as checked in and increments the event counter

## Scripts

**Backend**

```bash
npm start    # Start API server
```

**Frontend**

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## License

ISC

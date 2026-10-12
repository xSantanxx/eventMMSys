# Event Creation and Login System

A full-stack event management app for creating events, registering attendees, sending QR code confirmation emails, and checking guests in with a live camera scanner.

## Features

- **Split UX** — `/org` for organizers, `/e/:id` for attendees (shared landing at `/`)
- **Organizer auth** — register/login with JWT; events are owned by the logged-in organizer
- **Event scheduling** — organizer picks start/end times (+ timezone) when creating an event
- **Shareable register links** — `/e/:id/register` (copy from organizer dashboard)
- **Attendee list** — search + CSV export on the organizer event page
- **Signed QR codes** — HMAC-bound to event + attendee (`v1.…`); legacy hex tokens still work
- **Kiosk check-in** — fullscreen scanner, success/fail sounds, cooldown, live counts
- **Undo + audit log** — reverse a check-in; see who/when on the event page
- **Live dashboard** — counts/attendees refresh while scanning
- **Capacity & status** — draft / live / closed; optional max attendees
- **Health checks** — backend reports database and email provider status

### Frontend routes

| Path | Audience | Page |
|------|----------|------|
| `/` | Both | Choose organizer or attendee |
| `/org` | Organizer | Login / dashboard |
| `/org/events/:id` | Organizer | Event stats + share link + scanner entry |
| `/org/events/:id/check-in` | Organizer | QR scanner (auth required) |
| `/e/:id` | Attendee | Public event info |
| `/e/:id/register` | Attendee | Public registration |

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
│   ├── qrToken.js            # Signed QR HMAC helpers
│   ├── schema.sql            # Fresh-install schema
│   ├── schema_supabase.sql   # Safe migration for existing Supabase DBs
│   ├── schema_p1.sql         # Adds starts_at / ends_at / timezone
│   ├── schema_p2.sql         # Capacity, status, check_in_logs
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

Prefer running `backEnd/schema_supabase.sql` in the Supabase SQL Editor (handles existing tables). Fresh installs can use `backEnd/schema.sql`. Then run `schema_p1.sql` and `schema_p2.sql`.

Core tables: `organizers`, `events` (schedule + `capacity`/`status`), `attendees`, `check_in_logs`.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/health` | No | Server, database, and email status |
| `POST` | `/auth/register` | No | Create organizer account |
| `POST` | `/auth/login` | No | Log in; returns JWT |
| `GET` | `/auth/me` | Yes | Current organizer |
| `GET` | `/getEvents` | Yes | List your events |
| `POST` | `/addEvent` | Yes | Create event (`starts_at`, `ends_at`, `timezone`) |
| `GET` | `/:id` | No | Get event by ID |
| `GET` | `/:id/attendees?q=` | Yes | List/search attendees (owner only) |
| `GET` | `/:id/check-in-log` | Yes | Recent check-in / undo audit log |
| `POST` | `/:id/attendees/:attendeeId/undo-checkin` | Yes | Undo a check-in |
| `PATCH` | `/:id` | Yes | Update capacity / status |
| `POST` | `/:id/register` | No | Register attendee + email signed QR |
| `POST` | `/:id/signin` | Yes | Check in via QR token (owner only) |

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)

### 1. Database

Run `schema_supabase.sql` (or `schema.sql`), then `schema_p1.sql` and `schema_p2.sql`, in your Postgres / Supabase SQL editor.

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
| `JWT_SECRET` | Long random string for login + QR signing |
| `QR_HMAC_SECRET` | Optional; defaults to `JWT_SECRET` |
| `RESEND_API_KEY` | Resend API key (required on Render — SMTP is blocked) |
| `RESEND_FROM` | Sender address, e.g. `Event System <onboarding@resend.dev>` |
| `FRONTEND_URL` | Your Vercel frontend URL |

> **Note:** Render blocks outbound SMTP ports, so Gmail/Nodemailer will time out in production. Use Resend instead.

### Frontend (Vercel)

- **Root directory:** `frontEnd/screen`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **SPA routing:** `vercel.json` rewrites all paths to `index.html` (needed for `/e/:id`, `/org/events/:id`, etc.)

**Environment variable:**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Render backend URL, e.g. `https://your-api.onrender.com` |

### Database (Supabase)

1. Create a Supabase project
2. Run `schema_supabase.sql`, then `schema_p1.sql` and `schema_p2.sql`
3. Copy the connection string into `DATABASE_URL` on Render

### Deploy checklist

- [ ] Supabase: `schema_supabase.sql` + `schema_p1.sql` + `schema_p2.sql` applied
- [ ] Render: `DATABASE_URL`, `DATABASE_SSL=true`, `JWT_SECRET`
- [ ] Render: `RESEND_API_KEY` + `RESEND_FROM` (not Gmail SMTP)
- [ ] Render: `FRONTEND_URL` = Vercel URL
- [ ] Vercel: `VITE_API_URL` = Render API URL
- [ ] Smoke test: organizer create event → copy `/e/.../register` → register → check-in

## User Flow

1. Organizer registers/logs in and creates an event with start/end times
2. Organizer copies the public `/e/:id/register` link and shares it
3. Attendees open the link, register, and receive a signed QR by email
4. Organizer opens check-in and scans codes; dashboard shows attendee list / CSV

## Scripts

**Backend**

```bash
npm start    # Start API server
npm test     # Validation + QR token unit tests
```

**Frontend**

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Route + datetime helper tests
```

## License

ISC

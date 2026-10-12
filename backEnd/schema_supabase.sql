-- Safe for Supabase when events/attendees already exist.
-- Run this entire file in: Supabase → SQL Editor → New query → Run

-- 1) Organizer accounts
CREATE TABLE IF NOT EXISTS organizers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Events table (only created if missing)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT REFERENCES organizers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    registered INTEGER NOT NULL DEFAULT 0,
    checked_in INTEGER NOT NULL DEFAULT 0
);

-- 3) Patch older events tables that predate auth
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS organizer_id TEXT REFERENCES organizers(id) ON DELETE CASCADE;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS registered INTEGER NOT NULL DEFAULT 0;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS checked_in INTEGER NOT NULL DEFAULT 0;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- 4) Attendees
CREATE TABLE IF NOT EXISTS attendees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    qr_token TEXT NOT NULL UNIQUE,
    checked_in BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE attendees
    ADD COLUMN IF NOT EXISTS qr_token TEXT;

ALTER TABLE attendees
    ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE attendees
    ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Unique constraints (ignore if they already exist)
DO $$
BEGIN
    ALTER TABLE attendees ADD CONSTRAINT attendees_qr_token_key UNIQUE (qr_token);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN unique_violation THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE attendees ADD CONSTRAINT attendees_event_id_email_key UNIQUE (event_id, email);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN unique_violation THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_event ON attendees(qr_token, event_id);

-- Verify (you should see organizers, events, attendees)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organizers', 'events', 'attendees')
ORDER BY table_name;

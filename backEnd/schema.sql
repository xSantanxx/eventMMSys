-- Run against your PostgreSQL database before starting the API.
-- Fresh install: psql -d your_db -f schema.sql
-- Existing DB: see migration notes at the bottom.

CREATE TABLE IF NOT EXISTS organizers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    registered INTEGER NOT NULL DEFAULT 0,
    checked_in INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    qr_token TEXT NOT NULL UNIQUE,
    checked_in BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_event ON attendees(qr_token, event_id);

-- Migration from older schema (no organizers / organizer_id):
-- 1) CREATE TABLE organizers (...);
-- 2) INSERT a bootstrap organizer, then:
--    ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id TEXT REFERENCES organizers(id);
--    UPDATE events SET organizer_id = '<your-organizer-id>' WHERE organizer_id IS NULL;
--    ALTER TABLE events ALTER COLUMN organizer_id SET NOT NULL;
-- 3) Ensure attendees has UNIQUE (event_id, email) and unique qr_token.

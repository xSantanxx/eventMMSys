-- P2 migration: capacity, registration status, check-in audit log.
-- Run in Supabase SQL Editor after schema_p1.sql.

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS capacity INTEGER;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live';

-- Constrain status values (ignore if constraint already exists)
DO $$
BEGIN
    ALTER TABLE events
        ADD CONSTRAINT events_status_check
        CHECK (status IN ('draft', 'live', 'closed'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS check_in_logs (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_id TEXT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    organizer_id TEXT REFERENCES organizers(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('check_in', 'undo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_in_logs_event_id
    ON check_in_logs(event_id, created_at DESC);

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('capacity', 'status')
ORDER BY column_name;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'check_in_logs';

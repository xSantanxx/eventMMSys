-- P1 migration: event scheduling columns.
-- Run in Supabase SQL Editor after schema_supabase.sql / schema.sql.

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Backfill from legacy date/created_at when empty
UPDATE events
SET starts_at = COALESCE(starts_at, (date::text || ' 09:00:00')::timestamptz),
    ends_at = COALESCE(ends_at, (date::text || ' 17:00:00')::timestamptz)
WHERE starts_at IS NULL OR ends_at IS NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('date', 'starts_at', 'ends_at', 'timezone')
ORDER BY column_name;

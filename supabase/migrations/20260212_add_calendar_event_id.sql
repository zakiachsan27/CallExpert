-- Add calendar_event_id column to bookings table
-- This stores the Google Calendar event ID for reference/deletion

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_calendar_event_id 
ON bookings(calendar_event_id) 
WHERE calendar_event_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN bookings.calendar_event_id IS 'Google Calendar event ID for the booking meeting';

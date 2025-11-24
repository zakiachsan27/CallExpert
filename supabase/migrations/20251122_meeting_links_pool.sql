-- Migration: Meeting Links Pool System
-- Description: Alternative to Google Calendar API - use pre-generated Meet links pool
-- Date: 2025-11-22

-- 1. Create meeting_links_pool table
CREATE TABLE IF NOT EXISTS meeting_links_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_link TEXT NOT NULL UNIQUE,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for quick availability checks
CREATE INDEX idx_meeting_links_available ON meeting_links_pool(is_available);

-- Add comment
COMMENT ON TABLE meeting_links_pool IS 'Pool of pre-generated Google Meet links that are assigned to bookings';
COMMENT ON COLUMN meeting_links_pool.meeting_link IS 'Google Meet URL (e.g., https://meet.google.com/xxx-xxxx-xxx)';
COMMENT ON COLUMN meeting_links_pool.is_available IS 'Whether this link can be assigned (for future use/soft delete)';
COMMENT ON COLUMN meeting_links_pool.notes IS 'Optional notes about this link';

-- 2. Add meeting_link_id to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS meeting_link_id UUID REFERENCES meeting_links_pool(id);

-- Add index for foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_link_id ON bookings(meeting_link_id);

-- Add comment
COMMENT ON COLUMN bookings.meeting_link_id IS 'Reference to assigned meeting link from pool';

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_meeting_links_updated_at ON meeting_links_pool;
CREATE TRIGGER trigger_meeting_links_updated_at
  BEFORE UPDATE ON meeting_links_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_links_updated_at();

-- 5. Create helper function to find available meeting link (no time conflict)
CREATE OR REPLACE FUNCTION find_available_meeting_link(
  p_booking_date DATE,
  p_booking_time TIME,
  p_duration INTEGER
)
RETURNS TABLE(id UUID, meeting_link TEXT) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
BEGIN
  -- Calculate time range for the new booking
  v_start_time := (p_booking_date || ' ' || p_booking_time)::TIMESTAMPTZ;
  v_end_time := v_start_time + (p_duration || ' minutes')::INTERVAL;

  -- Find first available link with no time conflict
  RETURN QUERY
  SELECT ml.id, ml.meeting_link
  FROM meeting_links_pool ml
  WHERE ml.is_available = true
  AND ml.id NOT IN (
    -- Exclude links that are already used in overlapping time slots
    SELECT b.meeting_link_id
    FROM bookings b
    INNER JOIN session_types st ON st.id = b.session_type_id
    WHERE b.payment_status = 'paid'
    AND b.meeting_link_id IS NOT NULL
    AND b.booking_date = p_booking_date
    AND tstzrange(
      (b.booking_date || ' ' || b.booking_time)::TIMESTAMPTZ,
      (b.booking_date || ' ' || b.booking_time)::TIMESTAMPTZ + (COALESCE(st.duration, 60) || ' minutes')::INTERVAL
    ) && tstzrange(v_start_time, v_end_time)
  )
  ORDER BY ml.created_at
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_available_meeting_link IS 'Finds a meeting link that has no time conflict with existing paid bookings';

-- 6. Grant permissions (adjust based on your RLS policies)
-- Allow service role to manage meeting links
GRANT ALL ON meeting_links_pool TO service_role;
GRANT ALL ON meeting_links_pool TO postgres;

-- Allow authenticated users to read meeting links (they'll see it in their bookings)
GRANT SELECT ON meeting_links_pool TO authenticated;

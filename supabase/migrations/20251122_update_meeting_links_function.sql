-- Migration: Update find_available_meeting_link to return TABLE instead of UUID
-- Description: Returns both id and meeting_link to avoid redundant query
-- Date: 2025-11-22

-- Drop and recreate function with new signature
DROP FUNCTION IF EXISTS find_available_meeting_link(DATE, TIME, INTEGER);

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

COMMENT ON FUNCTION find_available_meeting_link IS 'Finds a meeting link that has no time conflict with existing paid bookings. Returns TABLE with id and meeting_link.';

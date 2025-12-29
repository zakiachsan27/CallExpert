-- Add "Available Now" feature for experts
-- This allows experts to indicate they're available for immediate consultations

-- Add available_now column to experts table
ALTER TABLE public.experts
ADD COLUMN IF NOT EXISTS available_now BOOLEAN DEFAULT FALSE;

-- Add available_now_until column to track when the availability expires
-- This allows mentors to set a time limit for their "available now" status
ALTER TABLE public.experts
ADD COLUMN IF NOT EXISTS available_now_until TIMESTAMP WITH TIME ZONE;

-- Add index for quick lookups of available experts
CREATE INDEX IF NOT EXISTS idx_experts_available_now ON public.experts(available_now) WHERE available_now = TRUE;

-- Add this table to realtime publication for instant updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'experts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.experts;
    RAISE NOTICE 'Added experts to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'experts already in supabase_realtime publication';
  END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN public.experts.available_now IS 'Indicates if expert is currently available for immediate consultations';
COMMENT ON COLUMN public.experts.available_now_until IS 'Optional timestamp when the available_now status should automatically expire';

-- Add is_instant column to bookings table to track instant bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS is_instant BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN public.bookings.is_instant IS 'True if this booking was made as an instant consultation when expert was available now';

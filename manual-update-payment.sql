-- Manual update payment status to PAID
-- Run this in Supabase SQL Editor ONLY after verifying payment in Midtrans

-- IMPORTANT: Only run this if you've confirmed payment in Midtrans Dashboard!

-- Update the booking payment status
UPDATE bookings
SET
  payment_status = 'paid',
  status = 'confirmed',
  paid_at = NOW(),
  updated_at = NOW()
WHERE order_id = 'ORDER-1763903452364-JMRHR0'
  AND payment_status = 'waiting';

-- Verify the update
SELECT
  id,
  order_id,
  status,
  payment_status,
  paid_at,
  total_price,
  booking_date,
  booking_time
FROM bookings
WHERE order_id = 'ORDER-1763903452364-JMRHR0';

-- Check if booking exists with this order_id
-- Run this in Supabase SQL Editor

SELECT
  id,
  order_id,
  user_id,
  expert_id,
  booking_date,
  booking_time,
  total_price,
  status,
  payment_status,
  created_at,
  updated_at
FROM bookings
WHERE order_id = 'ORDER-1763903452364-JMRHR0';

-- Also check payment logs
SELECT *
FROM payment_logs
WHERE order_id = 'ORDER-1763903452364-JMRHR0'
ORDER BY created_at DESC;

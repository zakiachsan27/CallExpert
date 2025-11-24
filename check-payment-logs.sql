-- Check payment logs for the order
-- Run this in Supabase SQL Editor

SELECT
  id,
  booking_id,
  order_id,
  transaction_status,
  payment_type,
  gross_amount,
  created_at,
  raw_notification
FROM payment_logs
WHERE order_id = 'ORDER-1763903452364-JMRHR0'
ORDER BY created_at DESC
LIMIT 5;

-- If no payment logs, check the booking status
SELECT
  id,
  order_id,
  status,
  payment_status,
  paid_at,
  total_price,
  created_at,
  updated_at
FROM bookings
WHERE order_id = 'ORDER-1763903452364-JMRHR0';

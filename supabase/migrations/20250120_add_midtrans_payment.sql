-- Add payment fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON bookings(order_id);

-- Create payment_logs table for tracking Midtrans notifications
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  order_id VARCHAR(255) NOT NULL,
  transaction_status VARCHAR(50) NOT NULL,
  payment_type VARCHAR(50),
  gross_amount DECIMAL(15, 2) NOT NULL,
  raw_notification JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_booking_id ON payment_logs(booking_id);

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);

-- Add RLS policies for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment logs
CREATE POLICY "Users can view own payment logs"
ON payment_logs
FOR SELECT
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Service role can insert payment logs (for webhook)
-- This will be handled by the Edge Function using service role key

-- Add comment to tables
COMMENT ON TABLE payment_logs IS 'Stores Midtrans payment notification logs';
COMMENT ON COLUMN payment_logs.raw_notification IS 'Full JSON payload from Midtrans webhook';

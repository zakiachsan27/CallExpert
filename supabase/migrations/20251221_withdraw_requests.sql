-- Withdraw Requests Table
-- Migration: Add withdraw_requests table for expert withdrawals

-- =============================================
-- WITHDRAW REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_expert_id ON withdraw_requests(expert_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created_at ON withdraw_requests(created_at DESC);

-- Enable RLS
ALTER TABLE withdraw_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Experts can view their own withdraw requests
CREATE POLICY "Experts can view own withdraw requests"
  ON withdraw_requests
  FOR SELECT
  USING (
    expert_id IN (
      SELECT id FROM experts WHERE user_id = auth.uid()
    )
  );

-- Policy: Experts can create withdraw requests
CREATE POLICY "Experts can create withdraw requests"
  ON withdraw_requests
  FOR INSERT
  WITH CHECK (
    expert_id IN (
      SELECT id FROM experts WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_withdraw_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_withdraw_requests_updated_at ON withdraw_requests;
CREATE TRIGGER trigger_withdraw_requests_updated_at
  BEFORE UPDATE ON withdraw_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdraw_requests_updated_at();

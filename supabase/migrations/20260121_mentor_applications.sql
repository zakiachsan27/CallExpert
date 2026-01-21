-- Create mentor_applications table for storing mentor registration applications
CREATE TABLE IF NOT EXISTS mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  whatsapp VARCHAR(20) NOT NULL,
  expertise TEXT NOT NULL,
  portfolio_link VARCHAR(500),
  linkedin_url VARCHAR(500),
  instagram_url VARCHAR(500),
  facebook_url VARCHAR(500),
  youtube_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_email ON mentor_applications(email);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_created_at ON mentor_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;

-- Policy for public insert (anyone can submit an application)
CREATE POLICY "Anyone can submit mentor application" ON mentor_applications
  FOR INSERT
  WITH CHECK (true);

-- Policy for reading (allow all for admin check in frontend)
CREATE POLICY "Anyone can read mentor applications" ON mentor_applications
  FOR SELECT
  USING (true);

-- Policy for update (allow all for admin in frontend)
CREATE POLICY "Anyone can update mentor applications" ON mentor_applications
  FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON mentor_applications TO anon;
GRANT ALL ON mentor_applications TO authenticated;

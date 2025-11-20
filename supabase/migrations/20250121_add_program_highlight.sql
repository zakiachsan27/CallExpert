-- Add program_highlight column to experts table
ALTER TABLE experts
ADD COLUMN IF NOT EXISTS program_highlight TEXT;

-- Add comment to column
COMMENT ON COLUMN experts.program_highlight IS 'Program highlight/description to attract potential clients';

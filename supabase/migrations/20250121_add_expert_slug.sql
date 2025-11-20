-- Add slug column to experts table
ALTER TABLE experts
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_experts_slug ON experts(slug);

-- Generate default slug from name for existing experts
-- This converts names to lowercase and replaces spaces with dashes
UPDATE experts
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Add constraint to ensure slug only contains lowercase alphanumeric and dashes
ALTER TABLE experts
ADD CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$');

-- Add comment to column
COMMENT ON COLUMN experts.slug IS 'URL-friendly unique identifier for expert profile (lowercase alphanumeric and dashes only)';

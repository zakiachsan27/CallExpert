-- Migration: Add RLS Policies for Meeting Links Pool
-- Description: Enable Row Level Security for meeting_links_pool table
-- Date: 2025-11-29

-- Enable RLS on meeting_links_pool table
ALTER TABLE meeting_links_pool ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to SELECT meeting links
-- Users need to read meeting links to display in their bookings
CREATE POLICY "Allow authenticated users to read meeting links"
ON meeting_links_pool
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only service role can INSERT meeting links
-- Only backend/admin should be able to add new links to the pool
CREATE POLICY "Only service role can insert meeting links"
ON meeting_links_pool
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 3: Only service role can UPDATE meeting links
-- Only backend/admin should be able to modify links
CREATE POLICY "Only service role can update meeting links"
ON meeting_links_pool
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: Only service role can DELETE meeting links
-- Only backend/admin should be able to delete links
CREATE POLICY "Only service role can delete meeting links"
ON meeting_links_pool
FOR DELETE
TO service_role
USING (true);

-- Add helpful comments
COMMENT ON POLICY "Allow authenticated users to read meeting links" ON meeting_links_pool
IS 'Users can view meeting links (they see it in their booking details)';

COMMENT ON POLICY "Only service role can insert meeting links" ON meeting_links_pool
IS 'Only backend/admin can add new meeting links to the pool';

COMMENT ON POLICY "Only service role can update meeting links" ON meeting_links_pool
IS 'Only backend/admin can modify meeting link properties';

COMMENT ON POLICY "Only service role can delete meeting links" ON meeting_links_pool
IS 'Only backend/admin can remove meeting links from the pool';

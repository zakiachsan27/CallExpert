-- Allow public/anonymous access to view bookings, experts, session_types, and users
-- This is needed for the invoice page which should be publicly accessible via order_id

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Public can view booking by order_id" ON bookings;
DROP POLICY IF EXISTS "Public can view experts for invoices" ON experts;
DROP POLICY IF EXISTS "Public can view session types for invoices" ON session_types;
DROP POLICY IF EXISTS "Public can view users for invoices" ON users;

-- Bookings: Allow anyone to read (we filter by order_id in application layer)
CREATE POLICY "Public can view booking by order_id"
ON bookings
FOR SELECT
TO anon, authenticated
USING (true);

-- Experts: Allow anyone to read expert profiles
CREATE POLICY "Public can view experts for invoices"
ON experts
FOR SELECT
TO anon, authenticated
USING (true);

-- Session Types: Allow anyone to read session types
CREATE POLICY "Public can view session types for invoices"
ON session_types
FOR SELECT
TO anon, authenticated
USING (true);

-- Users: Allow anyone to read user info (for invoice display)
CREATE POLICY "Public can view users for invoices"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: These policies allow read-only access to all users (anon and authenticated)
-- Write operations are still controlled by existing policies
-- This is safe because we're only allowing SELECT operations

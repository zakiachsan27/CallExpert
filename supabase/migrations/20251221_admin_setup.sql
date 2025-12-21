-- Admin Setup Migration
-- This migration adds RLS policies for admin access
--
-- PENTING: Sebelum menjalankan migration ini, buat admin auth user terlebih dahulu di Supabase Dashboard:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add user" > "Create new user"
-- 3. Buat user dengan email dan password berikut:
--
--    Email: admin@mentorinaja.com
--    Password: Admin@Secure123
--
-- 4. Centang "Auto Confirm User" agar email langsung terverifikasi

-- ============================================================
-- ADMIN EMAIL CONSTANT
-- ============================================================
-- Admin email yang diizinkan untuk akses penuh
-- Ganti dengan email admin yang sesuai jika diperlukan

-- ============================================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================================

-- Drop existing admin policies if they exist (for re-running)
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can view all experts" ON experts;
DROP POLICY IF EXISTS "Admin can view all withdraw requests" ON withdraw_requests;
DROP POLICY IF EXISTS "Admin can update withdraw requests" ON withdraw_requests;

-- Policy: Admin can view ALL bookings
CREATE POLICY "Admin can view all bookings"
  ON bookings
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- Policy: Admin can view ALL users
CREATE POLICY "Admin can view all users"
  ON users
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- Policy: Admin can view ALL experts (including inactive)
CREATE POLICY "Admin can view all experts"
  ON experts
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- Policy: Admin can view ALL withdraw requests
CREATE POLICY "Admin can view all withdraw requests"
  ON withdraw_requests
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- Policy: Admin can UPDATE withdraw requests (approve/reject)
CREATE POLICY "Admin can update withdraw requests"
  ON withdraw_requests
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- Policy: Admin can view ALL session types (including inactive)
DROP POLICY IF EXISTS "Admin can view all session types" ON session_types;
CREATE POLICY "Admin can view all session types"
  ON session_types
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
  );

-- ============================================================
-- OPTIONAL: Create admin user record in users table
-- ============================================================
-- This will be created when admin logs in for the first time
-- But you can also pre-create it here if needed

-- INSERT INTO users (id, email, name)
-- SELECT id, email, 'Super Admin'
-- FROM auth.users
-- WHERE email = 'admin@mentorinaja.com'
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Admin RLS policies created successfully!';
  RAISE NOTICE 'Admin email: admin@mentorinaja.com';
  RAISE NOTICE 'Remember to create the admin auth user in Supabase Dashboard!';
END $$;

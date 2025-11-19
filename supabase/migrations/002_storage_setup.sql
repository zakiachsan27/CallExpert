-- CallExpert Storage Setup
-- Migration 002: Storage Buckets and Policies

-- =============================================
-- CREATE STORAGE BUCKETS
-- =============================================

-- Insert avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Insert product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES - AVATARS
-- =============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated experts can upload their own avatar
CREATE POLICY "Experts can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Experts can update their own avatar
CREATE POLICY "Experts can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Experts can delete their own avatar
CREATE POLICY "Experts can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- STORAGE POLICIES - PRODUCT IMAGES
-- =============================================

-- Anyone can view product images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated experts can upload product images
CREATE POLICY "Experts can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM experts WHERE user_id = auth.uid()
  )
);

-- Experts can update their product images
CREATE POLICY "Experts can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM experts WHERE user_id = auth.uid()
  )
);

-- Experts can delete their product images
CREATE POLICY "Experts can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM experts WHERE user_id = auth.uid()
  )
);


-- ==============================================================================
-- Garg Traders: Supabase Storage Buckets & Policies
-- Optional: Run this in your Supabase SQL Editor if you wish to use Supabase Storage buckets
-- ==============================================================================

-- 1. Create public storage buckets for products and categories
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('products', 'products', true),
  ('categories', 'categories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Public Access Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Products" ON storage.objects;

-- 3. Create permissive public policies for seamless photo uploads
CREATE POLICY "Public Access Products" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('products', 'categories'));

CREATE POLICY "Public Upload Products" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('products', 'categories'));

CREATE POLICY "Public Update Products" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id IN ('products', 'categories'));

CREATE POLICY "Public Delete Products" 
ON storage.objects FOR DELETE 
USING (bucket_id IN ('products', 'categories'));

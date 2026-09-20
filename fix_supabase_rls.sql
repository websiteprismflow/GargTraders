-- ==============================================================================
-- Garg Traders: Permissive Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor to eliminate any 403 / 42501 permission errors
-- IMPORTANT: This DOES NOT delete or modify any products or categories!
-- ==============================================================================

-- 1. Drop restricted policies if present
DROP POLICY IF EXISTS "Admin Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Delete Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Permissive All Categories" ON public.categories;

DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Permissive All Products" ON public.products;

DROP POLICY IF EXISTS "Admin Insert Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Update Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Delete Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Public Read Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Permissive All Product Media" ON public.product_media;

DROP POLICY IF EXISTS "Admin Modify Site Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Permissive All Site Settings" ON public.site_settings;

-- 2. Make description column optional in products (if not already done)
ALTER TABLE public.products ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN description SET DEFAULT '';

-- 3. Create permissive policies for categories (Read & Write)
CREATE POLICY "Permissive All Categories" ON public.categories
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Create permissive policies for products (Read & Write)
CREATE POLICY "Permissive All Products" ON public.products
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Create permissive policies for product_media (Read & Write)
CREATE POLICY "Permissive All Product Media" ON public.product_media
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Create permissive policies for site_settings (Read & Write)
CREATE POLICY "Permissive All Site Settings" ON public.site_settings
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

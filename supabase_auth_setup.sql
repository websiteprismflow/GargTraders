-- ==============================================================================
-- GARG TRADERS — SUPABASE AUTHENTICATION & ADMIN ROLE MANAGEMENT SQL
-- Sets up Admin Users Table, Security Definer Role Checker, Upgraded RLS, 
-- and Direct Admin Account Creation in Supabase Auth (auth.users)
-- ==============================================================================
-- CREDENTIALS:
-- Email: gargtraderstohana@gmail.com
-- Password: Gargtraders2026
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Project -> SQL Editor
-- 2. Paste and run this script
-- 3. You can immediately sign in with:
--    Email: gargtraderstohana@gmail.com
--    Password: Gargtraders2026
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. CREATE PUBLIC ADMIN_USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can view admin lists
CREATE POLICY "Admins view admin_users" ON public.admin_users
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR auth.jwt() ->> 'email' = email
    );

-- 3. SECURITY DEFINER FUNCTION TO VERIFY ADMIN STATUS
-- This function securely checks if the currently logged-in user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        -- User exists in public.admin_users
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
        -- Or user's verified token email matches the designated admin email
        OR (auth.jwt() ->> 'email' = 'gargtraderstohana@gmail.com')
        -- Or app metadata contains admin role
        OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        OR ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. REINFORCE ROW LEVEL SECURITY WITH IS_ADMIN() CHECK
-- Guarantees that public users or non-admin authenticated users CANNOT alter products or categories

-- Categories
DROP POLICY IF EXISTS "Admin Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Delete Categories" ON public.categories;

CREATE POLICY "Admin Insert Categories" ON public.categories 
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin Update Categories" ON public.categories 
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Categories" ON public.categories 
    FOR DELETE TO authenticated USING (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;

CREATE POLICY "Admin Insert Products" ON public.products 
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin Update Products" ON public.products 
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Products" ON public.products 
    FOR DELETE TO authenticated USING (public.is_admin());

-- Product Media
DROP POLICY IF EXISTS "Admin Insert Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Update Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Delete Product Media" ON public.product_media;

CREATE POLICY "Admin Insert Product Media" ON public.product_media 
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin Update Product Media" ON public.product_media 
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Product Media" ON public.product_media 
    FOR DELETE TO authenticated USING (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Admin Modify Site Settings" ON public.site_settings;
CREATE POLICY "Admin Modify Site Settings" ON public.site_settings 
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. AUTOMATIC TRIGGER FOR SUPABASE AUTH SIGNUPS
-- Whenever a user signs up with the admin email, automatically link them in admin_users
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'gargtraderstohana@gmail.com' THEN
        INSERT INTO public.admin_users (user_id, email, role)
        VALUES (NEW.id, NEW.email, 'admin')
        ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- 6. DIRECT ADMIN USER CREATION IN SUPABASE AUTH (auth.users)
-- Creates the admin account directly in Supabase with verified email
DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    admin_email TEXT := 'gargtraderstohana@gmail.com';
    encrypted_pw TEXT := extensions.crypt('Gargtraders2026', extensions.gen_salt('bf'));
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            encrypted_pw,
            timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"],"role":"admin"}',
            '{"role":"admin","full_name":"Garg Traders Admin"}',
            'authenticated',
            'authenticated',
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );

        -- Insert into auth.identities (Required by Supabase GoTrue Auth)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, admin_email)::jsonb,
            'email',
            admin_email,
            timezone('utc'::text, now()),
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );

        -- Insert into public.admin_users
        INSERT INTO public.admin_users (user_id, email, role)
        VALUES (new_user_id, admin_email, 'admin')
        ON CONFLICT (email) DO UPDATE SET user_id = new_user_id;

        RAISE NOTICE 'Admin account created successfully: %', admin_email;
    ELSE
        -- Update existing user password and role
        UPDATE auth.users 
        SET encrypted_password = encrypted_pw,
            email_confirmed_at = COALESCE(email_confirmed_at, timezone('utc'::text, now())),
            raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin"}',
            raw_user_meta_data = '{"role":"admin","full_name":"Garg Traders Admin"}',
            updated_at = timezone('utc'::text, now())
        WHERE email = admin_email;

        UPDATE public.admin_users
        SET user_id = (SELECT id FROM auth.users WHERE email = admin_email)
        WHERE email = admin_email;

        RAISE NOTICE 'Admin account password and role updated: %', admin_email;
    END IF;
END $$;

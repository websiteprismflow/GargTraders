-- ==============================================================================
-- GARG TRADERS — COMPLETE SUPABASE POSTGRESQL DATABASE SETUP
-- Includes: Tables, Constraints, Indexes, Views, RLS Policies, Storage, and Seed Data
-- ==============================================================================
-- INSTRUCTIONS FOR SUPABASE:
-- 1. Open your Supabase project dashboard at https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" in the left navigation
-- 3. Click "New Query", paste this entire script, and click "Run"
-- 4. That's it! Your entire database, schema, RLS, storage, and catalog will be live.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCTS TABLE
-- ON DELETE RESTRICT: Guarantees a category cannot be deleted if products are attached to it
-- products.category_id links directly to categories.id, so renaming categories NEVER affects products!
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    model_number TEXT NOT NULL UNIQUE,
    metal_material TEXT NOT NULL,
    size TEXT NOT NULL,
    color TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCT MEDIA TABLE (UNLIMITED IMAGES & VIDEOS)
CREATE TABLE IF NOT EXISTS public.product_media (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SITE SETTINGS TABLE (EDITABLE ABOUT US, BRAND TEXT, AND ESTABLISHED STATEMENT)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_model_number ON public.products(model_number);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_order ON public.product_media(product_id, display_order);

-- 7. CATEGORIES SUMMARY VIEW WITH DYNAMIC PRODUCT COUNT
CREATE OR REPLACE VIEW public.view_categories AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.image,
    c.created_at,
    c.updated_at,
    COUNT(p.id) AS product_count
FROM public.categories c
LEFT JOIN public.products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.description, c.image, c.created_at, c.updated_at
ORDER BY c.name ASC;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running to avoid duplicate conflicts
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Delete Categories" ON public.categories;

DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;

DROP POLICY IF EXISTS "Public Read Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Insert Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Update Product Media" ON public.product_media;
DROP POLICY IF EXISTS "Admin Delete Product Media" ON public.product_media;

DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin Modify Site Settings" ON public.site_settings;

-- Public Read Policies (Anyone can browse products, categories, media, and site statements)
CREATE POLICY "Public Read Categories" ON public.categories 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Products" ON public.products 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Product Media" ON public.product_media 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public Read Site Settings" ON public.site_settings 
    FOR SELECT TO anon, authenticated USING (true);

-- Authenticated Admin Policies (Only authenticated users can insert, update, delete)
CREATE POLICY "Admin Insert Categories" ON public.categories 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin Update Categories" ON public.categories 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin Delete Categories" ON public.categories 
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin Insert Products" ON public.products 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin Update Products" ON public.products 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin Delete Products" ON public.products 
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin Insert Product Media" ON public.product_media 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin Update Product Media" ON public.product_media 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin Delete Product Media" ON public.product_media 
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin Modify Site Settings" ON public.site_settings 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. SUPABASE STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('categories', 'categories', true),
    ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public View Categories Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public View Products Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Categories Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Products Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Modify Categories Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Modify Products Storage" ON storage.objects;

CREATE POLICY "Public View Categories Storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'categories');

CREATE POLICY "Public View Products Storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admin Upload Categories Storage" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'categories');

CREATE POLICY "Admin Upload Products Storage" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

CREATE POLICY "Admin Modify Categories Storage" ON storage.objects
    FOR ALL TO authenticated USING (bucket_id = 'categories');

CREATE POLICY "Admin Modify Products Storage" ON storage.objects
    FOR ALL TO authenticated USING (bucket_id = 'products');

-- 10. REAL SEED DATA INSERTION

-- Site Settings
INSERT INTO public.site_settings (key, value)
VALUES
    ('about_company', 'Garg Traders is built around a simple idea — hardware should do more than complete a space. It should enhance it. We focus on hardware that combines refined design, dependable performance, security, and long-lasting quality.'),
    ('established_statement', 'Established: [YEAR] — Delivering architectural hardware excellence with enduring trust, precision engineering, and peerless craftsmanship.'),
    ('hero_headline', 'Hardware That Makes Your Home Premium, Secure & Long-Lasting.'),
    ('hero_subtext', 'Premium hardware designed to bring lasting strength, refined aesthetics, and dependable security to modern spaces.')
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = timezone('utc'::text, now());

-- Categories
INSERT INTO public.categories (id, name, description, image)
VALUES
    (1, 'Door Handles', 'Ergonomically sculpted architectural mortise and pull handles crafted in solid brass and aerospace-grade alloys.', '/images/cat_door_handles.jpg'),
    (2, 'Handle Locks', 'Integrated luxury lever handle locksets pairing ergonomic beauty with multi-point Euro-profile security cylinders.', '/images/cat_handle_locks.jpg'),
    (3, 'Door Locks', 'Heavy-duty deadlocks, digital smart biometric rim deadbolts, and high-security architectural latch systems.', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80'),
    (4, 'Glass Hardware', 'Architectural patch fittings, floor springs, shower hinges, and frameless glass partition hardware in stainless steel 316.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80'),
    (5, 'Cabinet Hardware', 'Precision knurled solid brass T-bar pulls, luxury cabinet knobs, and wardrobe profile handles in satin brass and graphite.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80'),
    (6, 'Architectural Hardware', 'Concealed 3D adjustable architectural door hinges, soft-closing sliding systems, and heavy pivot door hinges.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'),
    (7, 'Door Accessories', 'Solid brass cylindrical magnetic door stops, architectural flush bolts, heavy tower bolts, and entrance designer accessories.', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80'),
    (8, 'Other Hardware', 'Specialized commercial and residential fittings, magnetic catches, and bespoke architectural hardware components.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80')
ON CONFLICT (id) DO UPDATE 
SET name = excluded.name, description = excluded.description, image = excluded.image;

-- Reset sequence for categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- Products
INSERT INTO public.products (id, name, category_id, model_number, metal_material, size, color, description)
VALUES
    (1, 'Vanguard Knurled Brass Lever Handle', 1, 'GT-DH-801', 'Solid Forged Brass & Matte Graphite', 'Rose Ø52mm, Lever Length 138mm, Projection 58mm', 'Satin Brass & Matte Graphite', 'Engineered for luxury Indian penthouses and residences, the Vanguard lever handle combines diamond-cut knurled gripping with a heavy solid forged brass chassis. Tested to over 250,000 operational cycles for lifetime smooth actuation.'),
    (2, 'Aura Minimalist Chamfered Door Lever', 1, 'GT-DH-802', 'Solid Extruded Architectural Brass', 'Rose Ø50mm, Lever Length 135mm, Projection 55mm', 'Champagne Satin Brass', 'The Aura lever embodies purity of form with softened chamfered contours and an ultra-slim 4mm concealed rosette. Its weighted tactile feel provides an unmistakable sense of architectural substance.'),
    (3, 'Titanium Offset Heavy Entry Pull Handle', 1, 'GT-DH-803', 'Stainless Steel Grade 316 (Marine Quality)', 'Length 600mm, Diameter 32mm, CTC 450mm', 'PVD Matte Titanium Black', 'Designed for grand main entrance doors up to 3 meters in height. Engineered from marine-grade 316 stainless steel with an ultra-durable Physical Vapor Deposition (PVD) titanium finish resistant to coastal corrosion and UV exposure.'),
    (4, 'Regal Heritage Mortise Handle Lockset', 2, 'GT-HL-420', 'Cast Brass Plate with Forged Internal Tumblers', 'Plate 240mm × 50mm, Backset 60mm, CTC 85mm', 'Antique Hand-Rubbed Bronze', 'A masterpiece of classic Indian architectural hardware. Featuring a solid backplate with antiqued patina and high-precision Euro-profile cylinder lock with 5 computer-dimple keys for pick-resistant security.'),
    (5, 'Stratos Architectural Euro-Mortise Lockset', 2, 'GT-HL-422', 'Forged Zinc Alloy & Stainless Steel Internal Latch', 'Plate 200mm × 48mm, Backset 55mm', 'Brushed Nickel & Satin Chrome', 'Modern streamlined profile with anti-friction nylon insert latch for whisper-quiet door closure. Recommended for luxury bedrooms and executive offices.'),
    (6, 'Apex Fortress Deadbolt & Security Rim Lock', 3, 'GT-DL-905', 'Hardened Steel Alloy & Solid Brass Cylinder', 'Bolt Throw 25mm, Backset 60mm/70mm Adjustable', 'Matte Obsidian & Satin Brass Bezel', 'Engineered to withstand extreme forced-entry attempts. Features a 1-inch hardened steel anti-saw deadbolt and anti-drill cylinder pins, providing peace of mind for residential main entrances.'),
    (7, 'Sentry Smart Biometric Mortise Lock', 3, 'GT-DL-910', 'Aerospace Aluminum Alloy & Tempered Glass', '360mm × 75mm × 24mm', 'Deep Space Gray', 'Next-generation access control with semiconductor fingerprint sensor, digital anti-peep touchpad, RFID smart card, and mechanical emergency key override.'),
    (8, 'Lumina Heavy Glass Patch Fitting Set', 4, 'GT-GH-304', 'Stainless Steel 316 with Aluminum Core Body', 'Suits 10mm – 12mm Toughened Glass Doors', 'Brushed Stainless Satin', 'Precision-engineered top and bottom patch fittings with pivot bearings for frameless architectural glass entrance doors and conference rooms. Rated for doors up to 100 kg.'),
    (9, 'Solas 90-Degree Glass-to-Glass Shower Hinge', 4, 'GT-GH-312', 'Drop Forged Solid Brass', '90mm × 55mm (Glass Thickness 8mm - 12mm)', 'Mirror Polished Chrome', 'Heavy duty frameless shower enclosure hinge with self-centering spring mechanism from 25 degrees. Dual neoprene gaskets protect glass from stress cracking.'),
    (10, 'Linear Precision Knurled T-Bar Cabinet Pull', 5, 'GT-CH-108', 'Solid Extruded Brass Rod', 'Length 160mm, CTC 128mm, Bar Ø12mm, Height 35mm', 'Brushed Satin Gold', 'Add refined architectural tactility to kitchen cabinets, vanities, and custom millwork. Precision cross-knurled diamond pattern offers optimal finger grip and light refraction.'),
    (11, 'Fluted Architectural Wardrobe Handle (600mm)', 5, 'GT-CH-115', 'Solid Architectural Brass', 'Length 600mm, Projection 42mm, CTC 480mm', 'Matte Charcoal & Champagne Tip', 'Elongated statement pull designed for full-height bespoke wardrobes and tall pantry cabinetry. Features rhythmic fluted detailing along the spine.'),
    (12, 'Omni 3D Concealed Adjustable Door Hinge', 6, 'GT-AH-550', 'High-Tensile Zinc Alloy & Stainless Steel Links', 'Height 160mm, Width 28mm (Load Capacity 120kg / pair)', 'Champagne Bronze', 'Invisible when the door is closed, providing a seamless flush aesthetic. Fully adjustable in 3 dimensions (horizontal, vertical, depth) with high-density self-lubricating polymer bearings.'),
    (13, 'Cylinder Magnetic Floor Door Stopper', 7, 'GT-DA-210', 'Solid Brass Body & Neodymium Rare-Earth Magnet', 'Height 75mm, Base Ø50mm', 'Satin Brass & Matte Black', 'Floor mounted magnetic stop that cushions door impact and securely holds doors open even in strong drafts. Concealed floor fixings preserve clean flooring aesthetics.'),
    (14, 'Concealed Architectural Lever Action Flush Bolt', 7, 'GT-DA-225', 'Forged Solid Brass with Steel Rod', 'Length 200mm, Width 20mm, Shoot Depth 25mm', 'Antique Bronze', 'Mortised into the edge of passive double doors for clean, hidden anchoring at top and bottom. Smooth flip-lever mechanism provides effortless operation.')
ON CONFLICT (id) DO UPDATE 
SET name = excluded.name, category_id = excluded.category_id, model_number = excluded.model_number,
    metal_material = excluded.metal_material, size = excluded.size, color = excluded.color, description = excluded.description;

-- Reset sequence for products
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- Product Media
INSERT INTO public.product_media (id, product_id, media_type, media_url, display_order)
VALUES
    (1, 1, 'image', '/images/hero_door_handle.jpg', 0),
    (2, 1, 'image', '/images/cat_door_handles.jpg', 1),
    (3, 1, 'image', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80', 2),
    (4, 2, 'image', '/images/cat_door_handles.jpg', 0),
    (5, 2, 'image', '/images/hero_door_handle.jpg', 1),
    (6, 3, 'image', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', 0),
    (7, 3, 'image', '/images/hero_door_handle.jpg', 1),
    (8, 4, 'image', '/images/cat_handle_locks.jpg', 0),
    (9, 4, 'image', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', 1),
    (10, 5, 'image', '/images/cat_handle_locks.jpg', 0),
    (11, 6, 'image', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', 0),
    (12, 6, 'image', '/images/cat_handle_locks.jpg', 1),
    (13, 7, 'image', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', 0),
    (14, 8, 'image', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80', 0),
    (15, 9, 'image', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80', 0),
    (16, 10, 'image', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', 0),
    (17, 10, 'image', '/images/cat_door_handles.jpg', 1),
    (18, 11, 'image', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', 0),
    (19, 12, 'image', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80', 0),
    (20, 13, 'image', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', 0),
    (21, 13, 'image', '/images/hero_door_handle.jpg', 1),
    (22, 14, 'image', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', 0)
ON CONFLICT (id) DO UPDATE 
SET product_id = excluded.product_id, media_type = excluded.media_type, 
    media_url = excluded.media_url, display_order = excluded.display_order;

-- Reset sequence for product media
SELECT setval('product_media_id_seq', (SELECT MAX(id) FROM product_media));

-- ==============================================================================
-- DONE! GARG TRADERS SUPABASE DATABASE SETUP COMPLETE
-- ==============================================================================

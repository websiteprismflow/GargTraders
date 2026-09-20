import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('[Seed] Starting database seeding for Garg Traders...');

  // Setup image aliases
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const heroFile = files.find(f => f.startsWith('hero_door_handle'));
    const handleFile = files.find(f => f.startsWith('cat_door_handles'));
    const lockFile = files.find(f => f.startsWith('cat_handle_locks'));

    if (heroFile) fs.copyFileSync(path.join(imagesDir, heroFile), path.join(imagesDir, 'hero_door_handle.jpg'));
    if (handleFile) fs.copyFileSync(path.join(imagesDir, handleFile), path.join(imagesDir, 'cat_door_handles.jpg'));
    if (lockFile) fs.copyFileSync(path.join(imagesDir, lockFile), path.join(imagesDir, 'cat_handle_locks.jpg'));
  }

  // 1. Seed Admin
  const adminEmail = 'gargtraderstohana@gmail.com';
  const adminPassword = 'Gargtraders2026';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(adminEmail, passwordHash);
    console.log(`[Seed] Created admin account: ${adminEmail}`);
  } else {
    db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(passwordHash, adminEmail);
    console.log(`[Seed] Updated admin password for: ${adminEmail}`);
  }

  // 2. Seed Site Settings
  const settings = [
    {
      key: 'about_company',
      value: 'Garg Traders is built around a simple idea — hardware should do more than complete a space. It should enhance it. We focus on hardware that combines refined design, dependable performance, security, and long-lasting quality.'
    },
    {
      key: 'established_statement',
      value: 'Established: [YEAR] — Delivering architectural hardware excellence with enduring trust, precision engineering, and peerless craftsmanship.'
    },
    {
      key: 'hero_headline',
      value: 'Hardware That Makes Your Home Premium, Secure & Long-Lasting.'
    },
    {
      key: 'hero_subtext',
      value: 'Premium hardware designed to bring lasting strength, refined aesthetics, and dependable security to modern spaces.'
    }
  ];

  const upsertSetting = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  settings.forEach(s => upsertSetting.run(s.key, s.value));

  // 3. Seed Categories
  const categoriesData = [
    {
      name: 'Door Handles',
      description: 'Ergonomically sculpted architectural mortise and pull handles crafted in solid brass and aerospace-grade alloys.',
      image: '/images/cat_door_handles.jpg'
    },
    {
      name: 'Handle Locks',
      description: 'Integrated luxury lever handle locksets pairing ergonomic beauty with multi-point Euro-profile security cylinders.',
      image: '/images/cat_handle_locks.jpg'
    },
    {
      name: 'Door Locks',
      description: 'Heavy-duty deadlocks, digital smart biometric rim deadbolts, and high-security architectural latch systems.',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Glass Hardware',
      description: 'Architectural patch fittings, floor springs, shower hinges, and frameless glass partition hardware in stainless steel 316.',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Cabinet Hardware',
      description: 'Precision knurled solid brass T-bar pulls, luxury cabinet knobs, and wardrobe profile handles in satin brass and graphite.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Architectural Hardware',
      description: 'Concealed 3D adjustable architectural door hinges, soft-closing sliding systems, and heavy pivot door hinges.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Door Accessories',
      description: 'Solid brass cylindrical magnetic door stops, architectural flush bolts, heavy tower bolts, and entrance designer accessories.',
      image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80'
    },
    {
      name: 'Other Hardware',
      description: 'Specialized commercial and residential fittings, magnetic catches, and bespoke architectural hardware components.',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80'
    }
  ];

  const catMap = {}; // name -> id

  for (const cat of categoriesData) {
    let row = db.prepare('SELECT id, name FROM categories WHERE name = ?').get(cat.name);
    if (!row) {
      const res = db.prepare(`
        INSERT INTO categories (name, description, image, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).run(cat.name, cat.description, cat.image);
      catMap[cat.name] = Number(res.lastInsertRowid);
    } else {
      catMap[cat.name] = row.id;
      // Update image and description
      db.prepare('UPDATE categories SET image = ?, description = ? WHERE id = ?').run(cat.image, cat.description, row.id);
    }
  }

  // 4. Seed Products
  const productsData = [
    // Door Handles
    {
      category: 'Door Handles',
      name: 'Vanguard Knurled Brass Lever Handle',
      model_number: 'GT-DH-801',
      metal_material: 'Solid Forged Brass & Matte Graphite',
      size: 'Rose Ø52mm, Lever Length 138mm, Projection 58mm',
      color: 'Satin Brass & Matte Graphite',
      description: 'Engineered for luxury Indian penthouses and residences, the Vanguard lever handle combines diamond-cut knurled diamond gripping with a heavy solid forged brass chassis. Tested to over 250,000 operational cycles for lifetime smooth actuation.',
      media: [
        { media_url: '/images/hero_door_handle.jpg', media_type: 'image', display_order: 0 },
        { media_url: '/images/cat_door_handles.jpg', media_type: 'image', display_order: 1 },
        { media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 2 }
      ]
    },
    {
      category: 'Door Handles',
      name: 'Aura Minimalist Chamfered Door Lever',
      model_number: 'GT-DH-802',
      metal_material: 'Solid Extruded Architectural Brass',
      size: 'Rose Ø50mm, Lever Length 135mm, Projection 55mm',
      color: 'Champagne Satin Brass',
      description: 'The Aura lever embodies purity of form with softened chamfered contours and an ultra-slim 4mm concealed rosette. Its weighted tactile feel provides an unmistakable sense of architectural substance.',
      media: [
        { media_url: '/images/cat_door_handles.jpg', media_type: 'image', display_order: 0 },
        { media_url: '/images/hero_door_handle.jpg', media_type: 'image', display_order: 1 }
      ]
    },
    {
      category: 'Door Handles',
      name: 'Titanium Offset Heavy Entry Pull Handle',
      model_number: 'GT-DH-803',
      metal_material: 'Stainless Steel Grade 316 (Marine Quality)',
      size: 'Length 600mm, Diameter 32mm, CTC 450mm',
      color: 'PVD Matte Titanium Black',
      description: 'Designed for grand main entrance doors up to 3 meters in height. Engineered from marine-grade 316 stainless steel with an ultra-durable Physical Vapor Deposition (PVD) titanium finish resistant to coastal corrosion and UV exposure.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 },
        { media_url: '/images/hero_door_handle.jpg', media_type: 'image', display_order: 1 }
      ]
    },

    // Handle Locks
    {
      category: 'Handle Locks',
      name: 'Regal Heritage Mortise Handle Lockset',
      model_number: 'GT-HL-420',
      metal_material: 'Cast Brass Plate with Forged Internal Tumblers',
      size: 'Plate 240mm × 50mm, Backset 60mm, CTC 85mm',
      color: 'Antique Hand-Rubbed Bronze',
      description: 'A masterpiece of classic Indian architectural hardware. Featuring a solid backplate with antiqued patina and high-precision Euro-profile cylinder lock with 5 computer-dimple keys for pick-resistant security.',
      media: [
        { media_url: '/images/cat_handle_locks.jpg', media_type: 'image', display_order: 0 },
        { media_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 1 }
      ]
    },
    {
      category: 'Handle Locks',
      name: 'Stratos Architectural Euro-Mortise Lockset',
      model_number: 'GT-HL-422',
      metal_material: 'Forged Zinc Alloy & Stainless Steel Internal Latch',
      size: 'Plate 200mm × 48mm, Backset 55mm',
      color: 'Brushed Nickel & Satin Chrome',
      description: 'Modern streamlined profile with anti-friction nylon insert latch for whisper-quiet door closure. Recommended for luxury bedrooms and executive offices.',
      media: [
        { media_url: '/images/cat_handle_locks.jpg', media_type: 'image', display_order: 0 }
      ]
    },

    // Door Locks
    {
      category: 'Door Locks',
      name: 'Apex Fortress Deadbolt & Security Rim Lock',
      model_number: 'GT-DL-905',
      metal_material: 'Hardened Steel Alloy & Solid Brass Cylinder',
      size: 'Bolt Throw 25mm, Backset 60mm/70mm Adjustable',
      color: 'Matte Obsidian & Satin Brass Bezel',
      description: 'Engineered to withstand extreme forced-entry attempts. Features a 1-inch hardened steel anti-saw deadbolt and anti-drill cylinder pins, providing peace of mind for residential main entrances.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 },
        { media_url: '/images/cat_handle_locks.jpg', media_type: 'image', display_order: 1 }
      ]
    },
    {
      category: 'Door Locks',
      name: 'Sentry Smart Biometric Mortise Lock',
      model_number: 'GT-DL-910',
      metal_material: 'Aerospace Aluminum Alloy & Tempered Glass',
      size: '360mm × 75mm × 24mm',
      color: 'Deep Space Gray',
      description: 'Next-generation access control with semiconductor fingerprint sensor, digital anti-peep touchpad, RFID smart card, and mechanical emergency key override.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    },

    // Glass Hardware
    {
      category: 'Glass Hardware',
      name: 'Lumina Heavy Glass Patch Fitting Set',
      model_number: 'GT-GH-304',
      metal_material: 'Stainless Steel 316 with Aluminum Core Body',
      size: 'Suits 10mm – 12mm Toughened Glass Doors',
      color: 'Brushed Stainless Satin',
      description: 'Precision-engineered top and bottom patch fittings with pivot bearings for frameless architectural glass entrance doors and conference rooms. Rated for doors up to 100 kg.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    },
    {
      category: 'Glass Hardware',
      name: 'Solas 90-Degree Glass-to-Glass Shower Hinge',
      model_number: 'GT-GH-312',
      metal_material: 'Drop Forged Solid Brass',
      size: '90mm × 55mm (Glass Thickness 8mm - 12mm)',
      color: 'Mirror Polished Chrome',
      description: 'Heavy duty frameless shower enclosure hinge with self-centering spring mechanism from 25 degrees. Dual neoprene gaskets protect glass from stress cracking.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    },

    // Cabinet Hardware
    {
      category: 'Cabinet Hardware',
      name: 'Linear Precision Knurled T-Bar Cabinet Pull',
      model_number: 'GT-CH-108',
      metal_material: 'Solid Extruded Brass Rod',
      size: 'Length 160mm, CTC 128mm, Bar Ø12mm, Height 35mm',
      color: 'Brushed Satin Gold',
      description: 'Add refined architectural tactility to kitchen cabinets, vanities, and custom millwork. Precision cross-knurled diamond pattern offers optimal finger grip and light refraction.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 },
        { media_url: '/images/cat_door_handles.jpg', media_type: 'image', display_order: 1 }
      ]
    },
    {
      category: 'Cabinet Hardware',
      name: 'Fluted Architectural Wardrobe Handle (600mm)',
      model_number: 'GT-CH-115',
      metal_material: 'Solid Architectural Brass',
      size: 'Length 600mm, Projection 42mm, CTC 480mm',
      color: 'Matte Charcoal & Champagne Tip',
      description: 'Elongated statement pull designed for full-height bespoke wardrobes and tall pantry cabinetry. Features rhythmic fluted detailing along the spine.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    },

    // Architectural Hardware
    {
      category: 'Architectural Hardware',
      name: 'Omni 3D Concealed Adjustable Door Hinge',
      model_number: 'GT-AH-550',
      metal_material: 'High-Tensile Zinc Alloy & Stainless Steel Links',
      size: 'Height 160mm, Width 28mm (Load Capacity 120kg / pair)',
      color: 'Champagne Bronze',
      description: 'Invisible when the door is closed, providing a seamless flush aesthetic. Fully adjustable in 3 dimensions (horizontal, vertical, depth) with high-density self-lubricating polymer bearings.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    },

    // Door Accessories
    {
      category: 'Door Accessories',
      name: 'Cylinder Magnetic Floor Door Stopper',
      model_number: 'GT-DA-210',
      metal_material: 'Solid Brass Body & Neodymium Rare-Earth Magnet',
      size: 'Height 75mm, Base Ø50mm',
      color: 'Satin Brass & Matte Black',
      description: 'Floor mounted magnetic stop that cushions door impact and securely holds doors open even in strong drafts. Concealed floor fixings preserve clean flooring aesthetics.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 },
        { media_url: '/images/hero_door_handle.jpg', media_type: 'image', display_order: 1 }
      ]
    },
    {
      category: 'Door Accessories',
      name: 'Concealed Architectural Lever Action Flush Bolt',
      model_number: 'GT-DA-225',
      metal_material: 'Forged Solid Brass with Steel Rod',
      size: 'Length 200mm, Width 20mm, Shoot Depth 25mm',
      color: 'Antique Bronze',
      description: 'Mortised into the edge of passive double doors for clean, hidden anchoring at top and bottom. Smooth flip-lever mechanism provides effortless operation.',
      media: [
        { media_url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', media_type: 'image', display_order: 0 }
      ]
    }
  ];

  // Clear existing products to ensure clean seed
  const existingProductCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (existingProductCount === 0) {
    for (const prod of productsData) {
      const catId = catMap[prod.category];
      if (!catId) continue;

      const res = db.prepare(`
        INSERT INTO products (
          name, category_id, model_number, metal_material, size, color, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        prod.name,
        catId,
        prod.model_number,
        prod.metal_material,
        prod.size,
        prod.color,
        prod.description
      );

      const productId = res.lastInsertRowid;

      if (prod.media && prod.media.length > 0) {
        const insertMedia = db.prepare(`
          INSERT INTO product_media (product_id, media_type, media_url, display_order, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `);
        prod.media.forEach((m, idx) => {
          insertMedia.run(productId, m.media_type, m.media_url, m.display_order !== undefined ? m.display_order : idx);
        });
      }
    }
    console.log(`[Seed] Seeded ${productsData.length} products with complete media entries.`);
  } else {
    console.log(`[Seed] Database already contains ${existingProductCount} products. Skipping product insertion.`);
  }

  console.log('[Seed] Database initialization and seeding completed successfully!');
}

seed().catch(err => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});

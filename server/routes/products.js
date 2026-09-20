import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../auth.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();

// GET all products with optional filters: search 'q', 'category_id'
router.get('/', async (req, res) => {
  try {
    const { q, category_id } = req.query;

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('products')
        .select('*, categories(name), product_media(*)');

      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      if (q && q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(`name.ilike.${term},model_number.ilike.${term},metal_material.ilike.${term}`);
      }

      query = query.order('id', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        const formatted = data.map(p => {
          const images = (p.product_media || []).filter(m => m.media_type === 'image');
          images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          return {
            ...p,
            category_name: p.categories?.name || 'Hardware',
            main_image: images[0]?.media_url || '/images/hero_door_handle.jpg',
            media_count: p.product_media?.length || 0
          };
        });
        return res.json(formatted);
      }
    }

    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        c.name AS category_name,
        p.model_number, 
        p.metal_material, 
        p.size, 
        p.color, 
        p.description,
        p.created_at,
        p.updated_at,
        (
          SELECT media_url 
          FROM product_media 
          WHERE product_id = p.id AND media_type = 'image' 
          ORDER BY display_order ASC, id ASC 
          LIMIT 1
        ) AS main_image,
        (
          SELECT COUNT(*) 
          FROM product_media 
          WHERE product_id = p.id
        ) AS media_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      sql += ' AND (p.name LIKE ? OR p.model_number LIKE ? OR p.metal_material LIKE ? OR c.name LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY p.id DESC';

    const query = db.prepare(sql);
    const products = query.all(...params);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// GET single product by ID with full media gallery
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('*, categories(name), product_media(*)')
        .eq('id', id)
        .single();

      if (!prodErr && product) {
        const media = (product.product_media || []).sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        return res.json({
          ...product,
          category_name: product.categories?.name || 'Hardware',
          media
        });
      }
    }

    const prodQuery = db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        c.name AS category_name,
        p.model_number, 
        p.metal_material, 
        p.size, 
        p.color, 
        p.description,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `);
    const product = prodQuery.get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Fetch all media for this product ordered by display_order
    const mediaQuery = db.prepare(`
      SELECT id, product_id, media_type, media_url, display_order, created_at
      FROM product_media
      WHERE product_id = ?
      ORDER BY display_order ASC, id ASC
    `);
    const media = mediaQuery.all(id);

    res.json({
      ...product,
      media
    });
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// POST create product (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category_id,
      model_number,
      metal_material,
      size,
      color,
      description,
      media = []
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) return res.status(400).json({ error: 'Product Name is required.' });
    if (!category_id) return res.status(400).json({ error: 'Category is required.' });
    if (!model_number || !model_number.trim()) return res.status(400).json({ error: 'Model Number is required.' });
    if (!metal_material || !metal_material.trim()) return res.status(400).json({ error: 'Metal / Material is required.' });
    if (!size || !size.trim()) return res.status(400).json({ error: 'Size is required.' });

    const cleanDescription = description ? description.trim() : '';

    if (isSupabaseConfigured && supabase) {
      const { data: newProd, error: insertErr } = await supabase
        .from('products')
        .insert({
          name: name.trim(),
          category_id: Number(category_id),
          model_number: model_number.trim(),
          metal_material: metal_material.trim(),
          size: size.trim(),
          color: color ? color.trim() : null,
          description: cleanDescription
        })
        .select('*, categories(name)')
        .single();


      if (!insertErr && newProd) {
        let insertedMedia = [];
        if (Array.isArray(media) && media.length > 0) {
          const mediaRows = media.map((item, index) => ({
            product_id: newProd.id,
            media_type: item.media_type || 'image',
            media_url: item.media_url,
            display_order: item.display_order !== undefined ? item.display_order : index
          }));
          const { data: mData } = await supabase
            .from('product_media')
            .insert(mediaRows)
            .select();
          insertedMedia = mData || [];
        }

        return res.status(201).json({
          message: 'Product created successfully.',
          product: {
            ...newProd,
            category_name: newProd.categories?.name || 'Hardware',
            media: insertedMedia
          }
        });
      }
    }

    // Validate category exists in SQLite
    const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Selected category does not exist.' });
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (
        name, category_id, model_number, metal_material, size, color, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = insertProduct.run(
      name.trim(),
      category_id,
      model_number.trim(),
      metal_material.trim(),
      size.trim(),
      color ? color.trim() : null,
      cleanDescription
    );


    const productId = result.lastInsertRowid;

    // Insert media items if provided
    if (Array.isArray(media) && media.length > 0) {
      const insertMedia = db.prepare(`
        INSERT INTO product_media (product_id, media_type, media_url, display_order, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      media.forEach((item, index) => {
        if (item.media_url) {
          insertMedia.run(
            productId,
            item.media_type || 'image',
            item.media_url,
            item.display_order !== undefined ? item.display_order : index
          );
        }
      });
    }

    // Retrieve saved product
    const saved = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `).get(productId);

    const savedMedia = db.prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY display_order ASC').all(productId);

    res.status(201).json({
      message: 'Product created successfully.',
      product: { ...saved, media: savedMedia }
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT update product (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      model_number,
      metal_material,
      size,
      color,
      description,
      media
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Product Name is required.' });
    if (!category_id) return res.status(400).json({ error: 'Category is required.' });
    if (!model_number || !model_number.trim()) return res.status(400).json({ error: 'Model Number is required.' });
    if (!metal_material || !metal_material.trim()) return res.status(400).json({ error: 'Metal / Material is required.' });
    if (!size || !size.trim()) return res.status(400).json({ error: 'Size is required.' });

    const cleanDescription = description ? description.trim() : '';

    if (isSupabaseConfigured && supabase) {
      const { data: updatedProd, error: updErr } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          category_id: Number(category_id),
          model_number: model_number.trim(),
          metal_material: metal_material.trim(),
          size: size.trim(),
          color: color ? color.trim() : null,
          description: cleanDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, categories(name)')
        .single();

      if (!updErr && updatedProd) {
        if (Array.isArray(media)) {
          await supabase.from('product_media').delete().eq('product_id', id);
          if (media.length > 0) {
            const mediaRows = media.map((item, index) => ({
              product_id: Number(id),
              media_type: item.media_type || 'image',
              media_url: item.media_url,
              display_order: item.display_order !== undefined ? item.display_order : index
            }));
            await supabase.from('product_media').insert(mediaRows);
          }
        }

        const { data: freshMedia } = await supabase
          .from('product_media')
          .select('*')
          .eq('product_id', id)
          .order('display_order', { ascending: true });

        return res.json({
          message: 'Product updated successfully.',
          product: {
            ...updatedProd,
            category_name: updatedProd.categories?.name || 'Hardware',
            media: freshMedia || []
          }
        });
      }
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const updateProduct = db.prepare(`
      UPDATE products
      SET 
        name = ?,
        category_id = ?,
        model_number = ?,
        metal_material = ?,
        size = ?,
        color = ?,
        description = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    updateProduct.run(
      name.trim(),
      category_id,
      model_number.trim(),
      metal_material.trim(),
      size.trim(),
      color ? color.trim() : null,
      cleanDescription,
      id
    );


    // If media array is provided, synchronize media
    if (Array.isArray(media)) {
      db.prepare('DELETE FROM product_media WHERE product_id = ?').run(id);
      const insertMedia = db.prepare(`
        INSERT INTO product_media (product_id, media_type, media_url, display_order, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      media.forEach((item, index) => {
        if (item.media_url) {
          insertMedia.run(
            id,
            item.media_type || 'image',
            item.media_url,
            item.display_order !== undefined ? item.display_order : index
          );
        }
      });
    }

    const updated = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `).get(id);

    const updatedMedia = db.prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY display_order ASC').all(id);

    res.json({
      message: 'Product updated successfully.',
      product: { ...updated, media: updatedMedia }
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// DELETE product (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('product_media').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        return res.json({ message: 'Product deleted successfully.' });
      }
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Delete media records first (or cascade via DB)
    db.prepare('DELETE FROM product_media WHERE product_id = ?').run(id);
    const del = db.prepare('DELETE FROM products WHERE id = ?');
    del.run(id);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

export default router;

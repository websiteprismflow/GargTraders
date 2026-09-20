import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../auth.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();

// GET all categories with dynamic product count
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data: viewData, error: viewErr } = await supabase
        .from('view_categories')
        .select('*')
        .order('name', { ascending: true });

      if (!viewErr && viewData) {
        return res.json(viewData);
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*, products(count)')
        .order('name', { ascending: true });

      if (!error && data) {
        return res.json(data.map(c => ({
          ...c,
          product_count: c.products?.[0]?.count ?? 0
        })));
      }
    }

    const query = db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.image, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    const categories = query.all();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});


// GET single category by ID with its products
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data: category, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (!catErr && category) {
        const { data: products } = await supabase
          .from('products')
          .select('*, product_media(*)')
          .eq('category_id', id)
          .order('name', { ascending: true });

        const formattedProducts = (products || []).map(p => {
          const images = (p.product_media || []).filter(m => m.media_type === 'image');
          images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          return {
            ...p,
            main_image: images[0]?.media_url || '/images/hero_door_handle.jpg'
          };
        });

        return res.json({
          ...category,
          products: formattedProducts
        });
      }
    }

    const catQuery = db.prepare(`
      SELECT id, name, description, image, created_at, updated_at
      FROM categories
      WHERE id = ?
    `);
    const category = catQuery.get(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Fetch products belonging to this category
    const productsQuery = db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        p.model_number, 
        p.metal_material, 
        p.size, 
        p.color, 
        p.description,
        p.created_at,
        (
          SELECT media_url 
          FROM product_media 
          WHERE product_id = p.id AND media_type = 'image' 
          ORDER BY display_order ASC, id ASC 
          LIMIT 1
        ) AS main_image
      FROM products p
      WHERE p.category_id = ?
      ORDER BY p.name ASC
    `);
    const products = productsQuery.all(id);

    res.json({
      ...category,
      products
    });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to retrieve category.' });
  }
});

// POST create category (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category Name is required.' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: name.trim(),
          description: description ? description.trim() : '',
          image: image || ''
        })
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json({
          message: 'Category created successfully.',
          category: { ...data, product_count: 0 }
        });
      }
    }

    const insert = db.prepare(`
      INSERT INTO categories (name, description, image, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = insert.run(name.trim(), description ? description.trim() : '', image || '');

    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'Category created successfully.',
      category: { ...newCat, product_count: 0 }
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// PUT update category (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category Name is required.' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: name.trim(),
          description: description ? description.trim() : '',
          image: image || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({
          message: 'Category updated successfully.',
          category: data
        });
      }
    }

    const check = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!check) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const update = db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, image = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    update.run(name.trim(), description ? description.trim() : '', image || '', id);

    const updatedCat = db.prepare(`
      SELECT 
        c.*, 
        COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);

    res.json({
      message: 'Category updated successfully.',
      category: updatedCat
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// DELETE category (Admin only with safe validation)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (count && count > 0) {
        return res.status(400).json({
          error: `This category contains ${count} product(s). Please move or remove those products before deleting the category.`
        });
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (!error) {
        return res.json({ message: 'Category deleted successfully.' });
      }
    }

    const countCheck = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id);
    if (countCheck && countCheck.count > 0) {
      return res.status(400).json({
        error: `This category contains ${countCheck.count} product(s). Please move or remove those products before deleting the category.`
      });
    }

    const del = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = del.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;


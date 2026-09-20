import express from 'express';
import db from '../db.js';
import { verifyPassword, generateToken, authenticateToken } from '../auth.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!supaErr && supaData?.session) {
        return res.json({
          message: 'Authentication successful (Supabase Cloud).',
          token: supaData.session.access_token,
          admin: {
            id: supaData.user.id,
            email: supaData.user.email
          }
        });
      }
    }

    // 2. Check local SQLite DB fallback
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await verifyPassword(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(admin);

    res.json({
      message: 'Authentication successful (Local Secure Session).',
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during sign in. Please try again.' });
  }
});

// Verify current session
router.get('/me', authenticateToken, (req, res) => {
  try {
    const admin = db.prepare('SELECT id, email, created_at FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) {
      // If signed in via Supabase token, return user payload from decoded JWT
      return res.json({ id: req.user.id || 'admin', email: req.user.email || 'admin@gargtraders.com' });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify session.' });
  }
});

// Admin Dashboard KPI Stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const [cats, prods, media] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('product_media').select('*', { count: 'exact', head: true })
      ]);

      return res.json({
        total_categories: cats.count ?? 0,
        total_products: prods.count ?? 0,
        total_media: media.count ?? 0,
        source: 'supabase_cloud'
      });
    }

    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalMedia = db.prepare('SELECT COUNT(*) as count FROM product_media').get().count;

    res.json({
      total_categories: totalCategories,
      total_products: totalProducts,
      total_media: totalMedia,
      source: 'local_sqlite'
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
});

export default router;

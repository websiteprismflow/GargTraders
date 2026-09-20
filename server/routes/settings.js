import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../auth.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();

// GET all site settings (Public)
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (!error && data) {
        const settings = {};
        data.forEach(r => {
          settings[r.key] = r.value;
        });
        return res.json(settings);
      }
    }

    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

// PUT update site settings (Admin only)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;

    if (isSupabaseConfigured && supabase) {
      const rowsToUpsert = Object.entries(updates).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(rowsToUpsert);

      if (!error) {
        const { data } = await supabase.from('site_settings').select('*');
        const settings = {};
        (data || []).forEach(r => {
          settings[r.key] = r.value;
        });
        return res.json({
          message: 'Settings updated successfully.',
          settings
        });
      }
    }

    const upsert = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    for (const [key, value] of Object.entries(updates)) {
      upsert.run(key, String(value));
    }

    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    res.json({
      message: 'Settings updated successfully.',
      settings
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update site settings.' });
  }
});

export default router;

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import uploadRouter from './routes/upload.js';
import settingsRouter from './routes/settings.js';
import { supabase, isSupabaseConfigured, SUPABASE_URL } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


// Enable CORS for frontend development
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directories
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const imagesDir = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(imagesDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'Garg Traders',
    database: isSupabaseConfigured ? 'supabase_cloud' : 'local_sqlite',
    supabase_url: isSupabaseConfigured ? SUPABASE_URL : null,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Garg Traders Server] Running on http://localhost:${PORT}`);
  console.log(`[Garg Traders Server] Database: ${isSupabaseConfigured ? `Supabase Cloud (${SUPABASE_URL})` : 'Local SQLite'}`);
});


import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authenticateToken } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.query.folder === 'categories' ? 'categories' : 'products';
    const dest = path.join(uploadsRoot, subfolder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'video/mp4',
    'video/webm'
  ];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Unable to upload this file. Allowed formats are JPG, JPEG, PNG, WEBP, MP4, and WebM.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max for high-res architectural imagery / short video
  }
});

// Single file upload (Admin only)
router.post('/single', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file was provided.' });
    }

    const subfolder = req.query.folder === 'categories' ? 'categories' : 'products';
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileUrl = `/uploads/${subfolder}/${req.file.filename}`;

    res.json({
      url: fileUrl,
      media_type: isVideo ? 'video' : 'image',
      filename: req.file.filename
    });
  });
});

// Multiple files upload (Admin only)
router.post('/multiple', authenticateToken, (req, res) => {
  upload.array('files', 15)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Multiple file upload failed.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were provided.' });
    }

    const subfolder = req.query.folder === 'categories' ? 'categories' : 'products';
    const results = req.files.map((file, idx) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        media_url: `/uploads/${subfolder}/${file.filename}`,
        media_type: isVideo ? 'video' : 'image',
        display_order: idx
      };
    });

    res.json(results);
  });
});

export default router;

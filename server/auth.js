import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'garg_traders_secure_architectural_jwt_key_2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
    req.user = user;
    next();
  });
}

export function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

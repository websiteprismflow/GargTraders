# Garg Traders — Architectural Hardware for Modern Homes

A modern, high-performance web platform and admin catalog management system built for **Garg Traders**, an Indian hardware brand specializing in premium, secure, durable, and long-lasting hardware products for modern homes.

---

## 🌟 Key Features

* **Text-Based Brand Identity**: Elegant, minimalist text branding with hidden double-click admin access on the brand name.
* **Architectural Typography**: Manrope headings combined with Inter body typography for clear visual hierarchy.
* **Warm Architectural Palette**: Curated materials aesthetic (`#F7F5F0` off-white, `#171717` dark slate, `#B08D57` satin bronze accents).
* **Comprehensive Catalog System**:
  * Category exploration with real-time category name search.
  * Product detail showcase with high-res multi-angle image gallery and specifications table.
  * Direct WhatsApp inquiry integration with pre-filled product details.
  * Instant product sharing with native Web Share API and automatic fallback clipboard link copy with notification toast.
* **Admin Management Console**:
  * Add, edit, reorder, and remove categories and products.
  * Relational database integrity enforcement (`ON DELETE RESTRICT` for categories with active products).
  * Multi-image/video upload support.
* **Cloud Database & Auth**:
  * Powered by **Supabase** (PostgreSQL, Storage, and GoTrue Auth).
  * Seamless dual-mode architecture: live Supabase cloud connectivity with local SQLite zero-dependency fallback.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, React Router 7, Lucide Icons, Vite 8
* **Styling**: Modern Vanilla CSS Design System (CSS custom properties, glassmorphism, responsive micro-animations)
* **Backend**: Node.js, Express, Multer, JWT, Bcrypt
* **Cloud Database**: Supabase (PostgreSQL, Row Level Security, Storage Buckets)
* **Local Fallback DB**: Node 24 native `node:sqlite` (`DatabaseSync`)

---

## 🚀 Environment Setup

Create a `.env` file in the root directory (see `.env.example`):

```env
# Supabase Production Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://xyvvnoasucvalcgzcbjq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0oPlMWpWa1OJk-YhpnAulQ_nJiEmmw4

# Vite Aliases
VITE_SUPABASE_URL=https://xyvvnoasucvalcgzcbjq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0oPlMWpWa1OJk-YhpnAulQ_nJiEmmw4

# Backend Configuration
SUPABASE_URL=https://xyvvnoasucvalcgzcbjq.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0oPlMWpWa1OJk-YhpnAulQ_nJiEmmw4
JWT_SECRET=garg_traders_secure_architectural_jwt_key_2026
PORT=5000
```

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Servers (Frontend + Backend)
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

### 3. Build for Production
```bash
npm run build
```

---

## 🔐 Admin Sign-In

1. **Trigger**: Double-click on the **“Garg Traders”** text branding in the header navigation.
2. **Default Credentials**:
   * **Email**: `gargtraderstohana@gmail.com`
   * **Password**: `Gargtraders2026`

---

## 📄 License
Private repository for Garg Traders. All rights reserved.

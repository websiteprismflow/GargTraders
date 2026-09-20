// API Client for Garg Traders
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseCategories,
  getSupabaseCategoryWithProducts,
  createSupabaseCategory,
  updateSupabaseCategory,
  deleteSupabaseCategory,
  getSupabaseProducts,
  getSupabaseProduct,
  createSupabaseProduct,
  updateSupabaseProduct,
  deleteSupabaseProduct,
  getSupabaseSettings,
  updateSupabaseSettings,
  getSupabaseStats,
  uploadSupabaseFile,
  uploadMultipleSupabaseFiles
} from './supabase.js';


const API_BASE = '/api';

function getAuthHeader() {
  const token = sessionStorage.getItem('gt_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ============================================================================
// Categories
// ============================================================================
export const getCategories = async () => {
  if (isSupabaseConfigured) {
    try {
      const data = await getSupabaseCategories();
      if (data) return data;
    } catch (err) {
      console.warn('[Supabase] getCategories fallback to API:', err.message);
    }
  }
  return fetchApi('/categories');
};

export const getCategory = async (id) => {
  if (isSupabaseConfigured) {
    try {
      const data = await getSupabaseCategoryWithProducts(id);
      if (data) return data;
    } catch (err) {
      console.warn('[Supabase] getCategory fallback to API:', err.message);
    }
  }
  return fetchApi(`/categories/${id}`);
};

export const createCategory = async (catData) => {
  if (isSupabaseConfigured) {
    try {
      const data = await createSupabaseCategory(catData);
      return { message: 'Category created successfully.', category: data };
    } catch (err) {
      console.warn('[Supabase] createCategory fallback to API:', err.message);
    }
  }
  return fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(catData)
  });
};

export const updateCategory = async (id, catData) => {
  if (isSupabaseConfigured) {
    try {
      const data = await updateSupabaseCategory(id, catData);
      return { message: 'Category updated successfully.', category: data };
    } catch (err) {
      console.warn('[Supabase] updateCategory fallback to API:', err.message);
    }
  }
  return fetchApi(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(catData)
  });
};

export const deleteCategory = async (id) => {
  if (isSupabaseConfigured) {
    try {
      return await deleteSupabaseCategory(id);
    } catch (err) {
      console.warn('[Supabase] deleteCategory fallback to API:', err.message);
    }
  }
  return fetchApi(`/categories/${id}`, {
    method: 'DELETE'
  });
};

// ============================================================================
// Products
// ============================================================================
export const getProducts = async (params = {}) => {
  if (isSupabaseConfigured) {
    try {
      const data = await getSupabaseProducts(params);
      if (data) return data;
    } catch (err) {
      console.warn('[Supabase] getProducts fallback to API:', err.message);
    }
  }
  const query = new URLSearchParams();
  if (params.category_id) query.append('category_id', params.category_id);
  if (params.q) query.append('q', params.q);
  const qStr = query.toString();
  return fetchApi(`/products${qStr ? `?${qStr}` : ''}`);
};

export const getProduct = async (id) => {
  if (isSupabaseConfigured) {
    try {
      const data = await getSupabaseProduct(id);
      if (data) return data;
    } catch (err) {
      console.warn('[Supabase] getProduct fallback to API:', err.message);
    }
  }
  return fetchApi(`/products/${id}`);
};

export const createProduct = async (prodData) => {
  if (isSupabaseConfigured) {
    try {
      const prod = await createSupabaseProduct(prodData);
      return { message: 'Product created successfully.', product: prod };
    } catch (err) {
      console.warn('[Supabase] createProduct fallback to API:', err.message);
    }
  }
  return fetchApi('/products', {
    method: 'POST',
    body: JSON.stringify(prodData)
  });
};

export const updateProduct = async (id, prodData) => {
  if (isSupabaseConfigured) {
    try {
      const prod = await updateSupabaseProduct(id, prodData);
      return { message: 'Product updated successfully.', product: prod };
    } catch (err) {
      console.warn('[Supabase] updateProduct fallback to API:', err.message);
    }
  }
  return fetchApi(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(prodData)
  });
};

export const deleteProduct = async (id) => {
  if (isSupabaseConfigured) {
    try {
      return await deleteSupabaseProduct(id);
    } catch (err) {
      console.warn('[Supabase] deleteProduct fallback to API:', err.message);
    }
  }
  return fetchApi(`/products/${id}`, {
    method: 'DELETE'
  });
};

// ============================================================================
// Admin Auth & Stats
// ============================================================================
export const loginAdmin = async (email, password) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      if (data.session) {
        sessionStorage.setItem('gt_admin_token', data.session.access_token);
        sessionStorage.setItem('gt_admin_user', JSON.stringify(data.user));
      }
      return {
        token: data.session.access_token,
        admin: { id: data.user.id, email: data.user.email }
      };
    } catch (err) {
      console.warn('[Supabase Auth] Fallback to backend login:', err.message);
    }
  }

  // Fallback to local server API
  const data = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.token) {
    sessionStorage.setItem('gt_admin_token', data.token);
  }
  return data;
};

export const logoutAdmin = () => {
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut().catch(() => {});
  }
  sessionStorage.removeItem('gt_admin_token');
  sessionStorage.removeItem('gt_admin_user');
};

export const checkAdminAuth = async () => {
  if (isSupabaseConfigured && supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      return { id: user.id, email: user.email };
    }
  }

  const token = sessionStorage.getItem('gt_admin_token');
  if (!token) return Promise.reject(new Error('No token'));
  return fetchApi('/auth/me');
};

export const getAdminStats = async () => {
  if (isSupabaseConfigured) {
    try {
      const stats = await getSupabaseStats();
      if (stats) return stats;
    } catch (err) {
      console.warn('[Supabase] getAdminStats fallback to API:', err.message);
    }
  }
  return fetchApi('/auth/stats');
};

// ============================================================================
// Site Settings
// ============================================================================
export const getSiteSettings = async () => {
  if (isSupabaseConfigured) {
    try {
      const settings = await getSupabaseSettings();
      if (settings) return settings;
    } catch (err) {
      console.warn('[Supabase] getSiteSettings fallback to API:', err.message);
    }
  }
  return fetchApi('/settings');
};

export const updateSiteSettings = async (settings) => {
  if (isSupabaseConfigured) {
    try {
      return await updateSupabaseSettings(settings);
    } catch (err) {
      console.warn('[Supabase] updateSiteSettings fallback to API:', err.message);
    }
  }
  return fetchApi('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
};

// ============================================================================
// Media Uploads
// ============================================================================

/**
 * Optimizes an image file and converts to a lightweight Base64 data URL
 * ensuring instant uploads without server errors or missing bucket policies.
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    if (file.type && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to efficient WebP/JPEG format
        const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputFormat === 'image/jpeg' ? 0.85 : 1.0;
        const optimizedUrl = canvas.toDataURL(outputFormat, quality);
        resolve(optimizedUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const uploadFile = async (file, folder = 'products') => {
  // 1. If Supabase is connected, attempt Supabase Cloud Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const res = await uploadSupabaseFile(file, folder);
      if (res && res.url) {
        return res;
      }
    } catch (supaErr) {
      console.warn('[Supabase Storage] Notice: bucket upload skipped/unavailable:', supaErr.message);
    }
  }

  // 2. Attempt local Express server API upload (if running on localhost)
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/single?folder=${folder}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data && data.url) return data;
      }
    }
  } catch (apiErr) {
    console.warn('[API Upload] Backend upload not reachable:', apiErr.message);
  }

  // 3. Resilient client-side fallback (works 100% on Vercel without a Node server)
  const dataUrl = await fileToDataUrl(file);
  const isVideo = file.type ? file.type.startsWith('video/') : false;
  return {
    url: dataUrl,
    media_type: isVideo ? 'video' : 'image',
    filename: file.name
  };
};

export const uploadMultipleFiles = async (files, folder = 'products') => {
  const fileArray = Array.from(files);

  // 1. If Supabase is connected, attempt Supabase Cloud Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const supaResults = await uploadMultipleSupabaseFiles(fileArray, folder);
      if (Array.isArray(supaResults) && supaResults.length > 0) {
        return supaResults;
      }
    } catch (supaErr) {
      console.warn('[Supabase Storage] Multiple upload skipped/unavailable:', supaErr.message);
    }
  }

  // 2. Attempt local Express server API upload
  try {
    const formData = new FormData();
    fileArray.forEach(f => formData.append('files', f));

    const response = await fetch(`${API_BASE}/upload/multiple?folder=${folder}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (apiErr) {
    console.warn('[API Upload] Multiple upload not reachable:', apiErr.message);
  }

  // 3. Resilient client-side fallback
  const results = await Promise.all(
    fileArray.map(async (file, idx) => {
      const dataUrl = await fileToDataUrl(file);
      const isVideo = file.type ? file.type.startsWith('video/') : false;
      return {
        media_url: dataUrl,
        media_type: isVideo ? 'video' : 'image',
        display_order: idx
      };
    })
  );

  return results;
};


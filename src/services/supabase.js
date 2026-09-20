import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://xyvvnoasucvalcgzcbjq.supabase.co';

const supabaseAnonKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_0oPlMWpWa1OJk-YhpnAulQ_nJiEmmw4';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// Categories Queries
// ============================================================================
export async function getSupabaseCategories() {
  if (!supabase) return null;
  // Try view_categories with product counts first, fallback to categories
  const { data, error } = await supabase
    .from('view_categories')
    .select('*')
    .order('name');

  if (error) {
    const { data: cats, error: err2 } = await supabase
      .from('categories')
      .select('*, products(count)')
      .order('name');
    if (err2) throw err2;
    return cats.map(c => ({
      ...c,
      product_count: c.products?.[0]?.count ?? 0
    }));
  }
  return data;
}

export async function getSupabaseCategoryWithProducts(categoryId) {
  if (!supabase) return null;
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();
  if (catErr) throw catErr;

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*, product_media(*)')
    .eq('category_id', categoryId)
    .order('name');
  if (prodErr) throw prodErr;

  const formattedProducts = products.map(p => {
    const images = (p.product_media || []).filter(m => m.media_type === 'image');
    images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return {
      ...p,
      main_image: images[0]?.media_url || '/images/hero_door_handle.jpg'
    };
  });

  return {
    ...category,
    products: formattedProducts
  };
}

export async function createSupabaseCategory(catData) {
  if (!supabase) throw new Error('Supabase not connected');
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: catData.name.trim(),
      description: catData.description ? catData.description.trim() : '',
      image: catData.image || ''
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, product_count: 0 };
}

export async function updateSupabaseCategory(id, catData) {
  if (!supabase) throw new Error('Supabase not connected');
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: catData.name.trim(),
      description: catData.description ? catData.description.trim() : '',
      image: catData.image || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupabaseCategory(id) {
  if (!supabase) throw new Error('Supabase not connected');
  // Check for existing products
  const { count, error: countErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (count && count > 0) {
    throw new Error(
      `This category contains ${count} product(s). Please move or remove those products before deleting the category.`
    );
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

// ============================================================================
// Products Queries
// ============================================================================
export async function getSupabaseProducts(params = {}) {
  if (!supabase) return null;
  let query = supabase
    .from('products')
    .select('*, categories(name), product_media(*)');

  if (params.category_id) {
    query = query.eq('category_id', params.category_id);
  }

  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`name.ilike.${term},model_number.ilike.${term},metal_material.ilike.${term}`);
  }

  query = query.order('id', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return data.map(p => {
    const images = (p.product_media || []).filter(m => m.media_type === 'image');
    images.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return {
      ...p,
      category_name: p.categories?.name || 'Hardware',
      main_image: images[0]?.media_url || '/images/hero_door_handle.jpg',
      media_count: p.product_media?.length || 0
    };
  });
}

export async function getSupabaseProduct(productId) {
  if (!supabase) return null;
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*, categories(name), product_media(*)')
    .eq('id', productId)
    .single();
  if (prodErr) throw prodErr;

  const media = (product.product_media || []).sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  return {
    ...product,
    category_name: product.categories?.name || 'Hardware',
    media
  };
}

export async function createSupabaseProduct(prodData) {
  if (!supabase) throw new Error('Supabase not connected');
  const { data: newProd, error } = await supabase
    .from('products')
    .insert({
      name: prodData.name.trim(),
      category_id: prodData.category_id,
      model_number: prodData.model_number.trim(),
      metal_material: prodData.metal_material.trim(),
      size: prodData.size.trim(),
      color: prodData.color ? prodData.color.trim() : null,
      description: prodData.description.trim()
    })
    .select()
    .single();

  if (error) throw error;

  // Insert media items
  if (Array.isArray(prodData.media) && prodData.media.length > 0) {
    const mediaRows = prodData.media.map((m, idx) => ({
      product_id: newProd.id,
      media_type: m.media_type || 'image',
      media_url: m.media_url,
      display_order: m.display_order !== undefined ? m.display_order : idx
    }));

    const { error: mediaErr } = await supabase
      .from('product_media')
      .insert(mediaRows);
    if (mediaErr) console.error('Media insert error:', mediaErr);
  }

  return getSupabaseProduct(newProd.id);
}

export async function updateSupabaseProduct(id, prodData) {
  if (!supabase) throw new Error('Supabase not connected');
  const { error } = await supabase
    .from('products')
    .update({
      name: prodData.name.trim(),
      category_id: prodData.category_id,
      model_number: prodData.model_number.trim(),
      metal_material: prodData.metal_material.trim(),
      size: prodData.size.trim(),
      color: prodData.color ? prodData.color.trim() : null,
      description: prodData.description.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;

  // Sync media items if array provided
  if (Array.isArray(prodData.media)) {
    // Delete existing media
    await supabase.from('product_media').delete().eq('product_id', id);

    if (prodData.media.length > 0) {
      const mediaRows = prodData.media.map((m, idx) => ({
        product_id: id,
        media_type: m.media_type || 'image',
        media_url: m.media_url,
        display_order: m.display_order !== undefined ? m.display_order : idx
      }));
      await supabase.from('product_media').insert(mediaRows);
    }
  }

  return getSupabaseProduct(id);
}

export async function deleteSupabaseProduct(id) {
  if (!supabase) throw new Error('Supabase not connected');
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

// ============================================================================
// Site Settings
// ============================================================================
export async function getSupabaseSettings() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');
  if (error) throw error;

  const settings = {};
  (data || []).forEach(r => {
    settings[r.key] = r.value;
  });
  return settings;
}

export async function updateSupabaseSettings(settingsObj) {
  if (!supabase) throw new Error('Supabase not connected');
  const updates = Object.entries(settingsObj).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(updates);
  if (error) throw error;
  return settingsObj;
}

// ============================================================================
// Statistics for Admin Dashboard
// ============================================================================
export async function getSupabaseStats() {
  if (!supabase) return null;
  const [cats, prods, media] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('product_media').select('*', { count: 'exact', head: true })
  ]);

  return {
    total_categories: cats.count ?? 0,
    total_products: prods.count ?? 0,
    total_media: media.count ?? 0
  };
}

// ============================================================================
// Supabase Storage Media Uploads
// ============================================================================
export async function uploadSupabaseFile(file, bucket = 'products') {
  if (!supabase) throw new Error('Supabase not connected');
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  const isVideo = file.type.startsWith('video/');

  return {
    url: data.publicUrl,
    media_type: isVideo ? 'video' : 'image',
    filename: fileName
  };
}

export async function uploadMultipleSupabaseFiles(files, bucket = 'products') {
  const promises = Array.from(files).map((f, idx) =>
    uploadSupabaseFile(f, bucket).then(res => ({
      media_url: res.url,
      media_type: res.media_type,
      display_order: idx
    }))
  );
  return Promise.all(promises);
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Package, Settings, LogOut, Plus, Search, Edit2, Trash2,
  Upload, X, ArrowUp, ArrowDown, Image as ImageIcon, Video, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getAdminStats, checkAdminAuth, logoutAdmin,
  getSiteSettings, updateSiteSettings, uploadFile, uploadMultipleFiles
} from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard({ onOpenLoginModal }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'products' | 'settings'
  const [stats, setStats] = useState({ total_categories: 0, total_products: 0, total_media: 0 });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [catSearch, setCatSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('');

  // Modals & Form states
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', image: '' });

  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    category_id: '',
    model_number: '',
    metal_material: '',
    size: '',
    color: '',
    description: '',
    media: [] // [{ media_url, media_type, display_order }]
  });

  // Safe Deletion Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    warning: '',
    onConfirm: null
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const catImageInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Verify auth on mount
  useEffect(() => {
    async function verify() {
      try {
        await checkAdminAuth();
        loadAllData();
      } catch (err) {
        toast.error('Session expired or unauthorized. Please sign in.');
        onOpenLoginModal();
      }
    }
    verify();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, catsData, prodsData, settData] = await Promise.all([
        getAdminStats(),
        getCategories(),
        getProducts(),
        getSiteSettings()
      ]);
      setStats(statsData);
      setCategories(catsData);
      setProducts(prodsData);
      setSiteSettings(settData);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    toast.info('Signed out successfully.');
    navigate('/');
  };

  // --------------------------------------------------------------------------
  // Category Management
  // --------------------------------------------------------------------------
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatForm({ name: '', description: '', image: '' });
    setCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || ''
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      toast.error('Category Name is required.');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, catForm);
        toast.success('Category updated successfully.');
      } else {
        await createCategory(catForm);
        toast.success('Category created successfully.');
      }
      setCatModalOpen(false);
      loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategoryPrompt = (category) => {
    if (category.product_count > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Cannot Delete Category',
        message: `This category "${category.name}" contains ${category.product_count} product(s).`,
        warning: 'This category contains products. Please move or remove those products before deleting the category.',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to permanently delete "${category.name}"? This action cannot be undone.`,
      warning: '',
      onConfirm: async () => {
        try {
          await deleteCategory(category.id);
          toast.success('Category deleted successfully.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadAllData();
        } catch (err) {
          toast.error(err.message || 'Failed to delete category.');
        }
      }
    });
  };

  const handleCatImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'categories');
      setCatForm(prev => ({ ...prev, image: res.url }));
      toast.success('Category image uploaded.');
    } catch (err) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Product Management
  // --------------------------------------------------------------------------
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      category_id: categories[0]?.id || '',
      model_number: '',
      metal_material: '',
      size: '',
      color: '',
      description: '',
      media: []
    });
    setProdModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name || '',
      category_id: prod.category_id || '',
      model_number: prod.model_number || '',
      metal_material: prod.metal_material || '',
      size: prod.size || '',
      color: prod.color || '',
      description: prod.description || '',
      media: prod.media || (prod.main_image ? [{ media_url: prod.main_image, media_type: 'image', display_order: 0 }] : [])
    });
    setProdModalOpen(true);
  };

  const handleProductMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const res = await uploadMultipleFiles(files, 'products');
      setProdForm(prev => {
        const startOrder = prev.media.length;
        const newItems = res.map((item, idx) => ({
          ...item,
          display_order: startOrder + idx
        }));
        return {
          ...prev,
          media: [...prev.media, ...newItems]
        };
      });
      toast.success(`${files.length} media file(s) uploaded.`);
    } catch (err) {
      toast.error(err.message || 'Media upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeProductMedia = (index) => {
    setProdForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const moveProductMedia = (index, direction) => {
    setProdForm(prev => {
      const newMedia = [...prev.media];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newMedia.length) return prev;
      const temp = newMedia[index];
      newMedia[index] = newMedia[targetIndex];
      newMedia[targetIndex] = temp;
      // Re-assign display_order
      return {
        ...prev,
        media: newMedia.map((m, i) => ({ ...m, display_order: i }))
      };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!prodForm.name.trim()) return toast.error('Product Name is required.');
    if (!prodForm.category_id) return toast.error('Category is required.');
    if (!prodForm.model_number.trim()) return toast.error('Model Number is required.');
    if (!prodForm.metal_material.trim()) return toast.error('Metal / Material is required.');
    if (!prodForm.size.trim()) return toast.error('Size is required.');
    if (!prodForm.description.trim()) return toast.error('Description is required.');

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, prodForm);
        toast.success('Product updated successfully.');
      } else {
        await createProduct(prodForm);
        toast.success('Product created successfully.');
      }
      setProdModalOpen(false);
      loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteProductPrompt = (product) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}" (${product.model_number})? Associated media will also be removed.`,
      warning: '',
      onConfirm: async () => {
        try {
          await deleteProduct(product.id);
          toast.success('Product deleted successfully.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadAllData();
        } catch (err) {
          toast.error(err.message || 'Failed to delete product.');
        }
      }
    });
  };

  // --------------------------------------------------------------------------
  // Site Settings Management
  // --------------------------------------------------------------------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSiteSettings(siteSettings);
      toast.success('Site settings updated successfully.');
    } catch (err) {
      toast.error('Failed to update site settings.');
    }
  };

  // Filtered lists
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(catSearch.toLowerCase()))
  );

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.model_number.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.category_name.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCategory = !prodCatFilter || String(p.category_id) === String(prodCatFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="section admin-layout">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">CMS Administration</span>
            <h1 style={{ fontSize: '2.4rem' }}>Garg Traders Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={loadAllData} className="btn btn-secondary btn-sm" title="Refresh data">
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 14. ADMIN DASHBOARD SUMMARY STATS */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Total Categories</div>
            <div className="stat-card-value">{stats.total_categories}</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Dynamically loaded from database
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Products</div>
            <div className="stat-card-value">{stats.total_products}</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Active showroom inventory
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Media Items</div>
            <div className="stat-card-value">{stats.total_media}</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Images &amp; gallery assets
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories ({categories.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Site Settings
          </button>
        </div>

        {/* TAB 1: CATEGORIES SECTION */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              <button onClick={openAddCategoryModal} className="btn btn-brass">
                <Plus size={16} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Product Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td style={{ width: '80px' }}>
                          <img
                            src={cat.image || '/images/cat_door_handles.jpg'}
                            alt={cat.name}
                            className="admin-thumb"
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                        <td style={{ maxWidth: '350px', color: 'var(--text-secondary)' }}>
                          {cat.description || '—'}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            backgroundColor: 'var(--brass-light)',
                            color: 'var(--brass-dark)',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}>
                            {cat.product_count} {cat.product_count === 1 ? 'Product' : 'Products'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openEditCategoryModal(cat)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Category"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategoryPrompt(cat)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--danger)' }}
                              title="Delete Category"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS SECTION */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flexGrow: 1, maxWidth: '650px' }}>
                <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by product name or model..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>

                <select
                  value={prodCatFilter}
                  onChange={(e) => setProdCatFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', minWidth: '180px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button onClick={openAddProductModal} className="btn btn-brass">
                <Plus size={16} />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Model Number</th>
                    <th>Category</th>
                    <th>Metal / Material</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ width: '70px' }}>
                          <img
                            src={prod.main_image || '/images/hero_door_handle.jpg'}
                            alt={prod.name}
                            className="admin-thumb"
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{prod.name}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brass-dark)' }}>
                            {prod.model_number}
                          </span>
                        </td>
                        <td>{prod.category_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{prod.metal_material}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{prod.size}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{prod.color || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openEditProductModal(prod)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Product"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProductPrompt(prod)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--danger)' }}
                              title="Delete Product"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '720px', background: 'var(--bg-surface)', padding: '2rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Brand Statements &amp; Text</h2>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Company About Us Statement</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={siteSettings.about_company || ''}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, about_company: e.target.value }))}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Displayed in the About Us section on the homepage.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Trusted Experience Statement</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={siteSettings.established_statement || ''}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, established_statement: e.target.value }))}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Fourth value card statement. Placeholder format: Established: [YEAR].
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Hero Headline Supporting Text</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={siteSettings.hero_subtext || ''}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, hero_subtext: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Save Site Settings
              </button>
            </form>
          </div>
        )}

        {/* CATEGORY ADD/EDIT MODAL */}
        {catModalOpen && (
          <div className="modal-overlay" onClick={() => setCatModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                <button onClick={() => setCatModalOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Category Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="e.g. Premium Door Handles"
                      required
                      autoFocus
                    />
                    {editingCategory && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Note: Renaming this category safely retains all associated products automatically.
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <textarea
                      className="form-textarea"
                      value={catForm.description}
                      onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Short description of this category's hardware..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category Image</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={catForm.image}
                        onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                        placeholder="/images/... or image URL"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => catImageInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload size={14} />
                        <span>Upload</span>
                      </button>
                      <input
                        ref={catImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleCatImageUpload}
                      />
                    </div>
                    {catForm.image && (
                      <div style={{ width: '120px', height: '90px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <img src={catForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCatModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRODUCT ADD/EDIT MODAL */}
        {prodModalOpen && (
          <div className="modal-overlay" onClick={() => setProdModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
              <div className="modal-header">
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setProdModalOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Product Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={prodForm.name}
                        onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                        placeholder="e.g. Vanguard Knurled Lever"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Category <span className="required">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={prodForm.category_id}
                        onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Model Number <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={prodForm.model_number}
                        onChange={(e) => setProdForm({ ...prodForm, model_number: e.target.value })}
                        placeholder="e.g. GT-DH-801"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Metal / Material <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={prodForm.metal_material}
                        onChange={(e) => setProdForm({ ...prodForm, metal_material: e.target.value })}
                        placeholder="e.g. Solid Forged Brass"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Size <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={prodForm.size}
                        onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                        placeholder="e.g. 138mm × Ø52mm"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color / Finish (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={prodForm.color}
                      onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                      placeholder="e.g. Satin Brass & Matte Graphite"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Description <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      value={prodForm.description}
                      onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      placeholder="Comprehensive architectural product description..."
                      required
                    />
                  </div>

                  {/* 19. UNLIMITED PRODUCT MEDIA UPLOADS & REORDERING */}
                  <div className="form-group">
                    <label className="form-label">
                      Product Media Gallery (Unlimited Images / Videos)
                    </label>

                    <div
                      className="media-uploader-box"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={24} color="var(--brass-primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {uploading ? 'Uploading media...' : 'Click to select media from your computer'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Supports JPG, PNG, WEBP, MP4, WebM (Multiple files supported)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        style={{ display: 'none' }}
                        onChange={handleProductMediaUpload}
                      />
                    </div>

                    {/* Media Previews with Reorder & Remove */}
                    {prodForm.media.length > 0 && (
                      <div className="media-preview-list">
                        {prodForm.media.map((m, idx) => (
                          <div key={idx} className="media-preview-item" style={{ position: 'relative' }}>
                            {m.media_type === 'video' ? (
                              <video src={m.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={m.media_url} alt={`Media ${idx + 1}`} />
                            )}

                            {idx === 0 && (
                              <span style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '4px',
                                background: 'var(--brass-primary)',
                                color: '#FFFFFF',
                                fontSize: '9px',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}>
                                Primary
                              </span>
                            )}

                            <button
                              type="button"
                              className="media-preview-remove"
                              onClick={() => removeProductMedia(idx)}
                              title="Remove media"
                            >
                              <X size={12} />
                            </button>

                            {/* Reordering arrows */}
                            <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '2px' }}>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveProductMedia(idx, -1)}
                                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px', borderRadius: '2px' }}
                                  title="Move earlier"
                                >
                                  <ArrowUp size={10} />
                                </button>
                              )}
                              {idx < prodForm.media.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveProductMedia(idx, 1)}
                                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px', borderRadius: '2px' }}
                                  title="Move later"
                                >
                                  <ArrowDown size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setProdModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          warning={confirmModal.warning}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}

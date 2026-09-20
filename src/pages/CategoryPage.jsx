import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Search, Eye } from 'lucide-react';
import { getCategory } from '../services/api';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getCategory(categoryId);
        setCategory(data);
      } catch (err) {
        setError('Category not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>Category Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>The requested hardware category could not be located.</p>
        <Link to="/collection" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Back to Collection</span>
        </Link>
      </div>
    );
  }

  const products = category.products || [];
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.model_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.metal_material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/collection" style={{ color: 'var(--text-secondary)' }}>Collection</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{category.name}</span>
        </nav>

        {/* Category Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '3.5rem' }}>
          <div>
            <span className="section-eyebrow">Category</span>
            <h1 className="section-title">{category.name}</h1>
            {category.description && (
              <p className="section-subtitle" style={{ maxWidth: '650px' }}>
                {category.description}
              </p>
            )}
          </div>

          {/* Search Filter */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search in category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              {searchTerm ? 'No products match your search query.' : 'No products are currently available in this category.'}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn btn-secondary btn-sm">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/collection/${category.id}/${product.id}`}
                className="product-card"
              >
                <div className="product-card-media">
                  <img
                    src={product.main_image || '/images/hero_door_handle.jpg'}
                    alt={product.name}
                    loading="lazy"
                  />
                  <span className="product-model-pill">
                    {product.model_number}
                  </span>
                </div>
                <div className="product-card-body">
                  <span className="product-category-tag">{category.name}</span>
                  <h3 className="product-card-title">{product.name}</h3>
                  <div className="product-material-text">{product.metal_material}</div>
                  {product.description && (
                    <p className="product-card-desc">{product.description}</p>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>

                    <span className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      <span>View Product</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

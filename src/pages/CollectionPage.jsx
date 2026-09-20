import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import { getCategories } from '../services/api';

export default function CollectionPage() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      category.name.toLowerCase().includes(term) ||
      (category.description && category.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Header & Search Bar Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div>
            <span className="section-eyebrow">Product Catalog</span>
            <h1 className="section-title">Architectural Collections</h1>
            <p className="section-subtitle">
              Explore our thoughtfully curated categories of architectural hardware, precision-engineered for modern Indian homes and commercial spaces.
            </p>
          </div>

          {/* Category Search Input */}
          <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                id="category-search-input"
                className="form-input"
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.65rem',
                  paddingRight: searchTerm ? '2.5rem' : '1rem',
                  height: '46px',
                  fontSize: '0.925rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {searchTerm && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Found {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Loading collections...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4.5rem 2rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              No categories match "{searchTerm}"
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', maxWidth: '480px', margin: '0 auto 1.75rem' }}>
              We couldn't find any architectural hardware categories matching your search term. Try searching for "Door Handles", "Locks", or "Glass".
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchTerm('')}
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                to={`/collection/${category.id}`}
                className="category-card"
              >
                <div className="category-card-media">
                  <img
                    src={category.image || '/images/cat_door_handles.jpg'}
                    alt={category.name}
                    loading="lazy"
                  />
                  <span className="category-product-badge">
                    {category.product_count} {category.product_count === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
                <div className="category-card-body">
                  <h3 className="category-card-title">{category.name}</h3>
                  <p className="category-card-desc">{category.description}</p>
                  <span className="category-card-action">
                    <span>View Products</span>
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

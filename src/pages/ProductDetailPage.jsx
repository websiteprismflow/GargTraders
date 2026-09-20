import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Share2, ArrowLeft, Check, Copy } from 'lucide-react';
import { getProduct } from '../services/api';
import MediaGallery from '../components/MediaGallery';
import { useToast } from '../context/ToastContext';

export default function ProductDetailPage() {
  const { categoryId, productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getProduct(productId);
        setProduct(data);
      } catch (err) {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  // Product Share Feature
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${product.name} (${product.model_number}) | Garg Traders`;
    const shareText = `Explore ${product.name} by Garg Traders - Premium architectural hardware for modern spaces.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        toast.success('Shared successfully.');
        return;
      } catch (err) {
        // Fallback to clipboard if user dismissed or share failed
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Product link copied.');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Unable to copy product link.');
    }
  };

  if (loading) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>The requested architectural hardware product could not be found.</p>
        <Link to="/collection" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Collection</span>
        </Link>
      </div>
    );
  }

  // Filter non-empty specifications only
  const specifications = [
    { label: 'Category', value: product.category_name },
    { label: 'Model Number', value: product.model_number },
    { label: 'Metal / Material', value: product.metal_material },
    { label: 'Size', value: product.size },
    { label: 'Color / Finish', value: product.color }
  ].filter(spec => spec.value && String(spec.value).trim() !== '');

  return (
    <div className="section" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/collection" style={{ color: 'var(--text-secondary)' }}>Collection</Link>
          <ChevronRight size={14} />
          <Link to={`/collection/${product.category_id}`} style={{ color: 'var(--text-secondary)' }}>
            {product.category_name}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* 9. TWO-COLUMN PRODUCT SHOWROOM LAYOUT */}
        <div className="product-detail-layout">
          {/* LEFT SIDE: Media Gallery */}
          <div>
            <MediaGallery media={product.media} productName={product.name} />
          </div>

          {/* RIGHT SIDE: Information, Specifications & Share CTA */}
          <div className="product-info-panel">
            <div className="product-meta-header">
              <span className="product-model-label">
                Model: {product.model_number}
              </span>
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="product-detail-desc">{product.description}</p>
            </div>

            {/* Specifications Table - only non-empty fields */}
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
                Product Specifications
              </h3>
              <table className="specifications-table">
                <tbody>
                  {specifications.map((spec, idx) => (
                    <tr key={idx} className="spec-row">
                      <td className="spec-label">{spec.label}</td>
                      <td className="spec-value">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 10. PRODUCT SHARE FEATURE */}
            <div className="share-action-box">
              <button
                type="button"
                onClick={handleShare}
                className="btn-share"
                id="share-product-button"
                aria-label="Share this product"
              >
                {copied ? <Check size={18} color="var(--brass-primary)" /> : <Share2 size={18} />}
                <span>{copied ? 'Product Link Copied' : 'Share Product'}</span>
              </button>

              <Link to={`/collection/${product.category_id}`} className="btn btn-secondary">
                <span>View More in {product.category_name}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function MediaGallery({ media = [], productName = 'Product' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  if (!media || media.length === 0) {
    return (
      <div className="product-gallery">
        <div className="gallery-main-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No media available</p>
        </div>
      </div>
    );
  }

  const currentItem = media[currentIndex] || media[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === media.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      // Swipe left -> Next
      handleNext();
    } else if (diff < -50) {
      // Swipe right -> Prev
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="product-gallery">
      {/* Main Preview with Mobile Swipe */}
      <div
        className="gallery-main-preview"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentItem.media_type === 'video' ? (
          <video
            src={currentItem.media_url}
            controls
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
          />
        ) : (
          <img
            src={currentItem.media_url}
            alt={`${productName} view ${currentIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Navigation arrows if multiple media items */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails List */}
      {media.length > 1 && (
        <div className="gallery-thumbnails" role="tablist" aria-label="Product Media Thumbnails">
          {media.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              className={`gallery-thumb ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-selected={idx === currentIndex}
              role="tab"
            >
              {item.media_type === 'video' ? (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#2A2A30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <Play size={18} fill="#FFFFFF" />
                </div>
              ) : (
                <img src={item.media_url} alt={`Thumbnail ${idx + 1}`} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

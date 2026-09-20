import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Award, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { getCategories, getSiteSettings } from '../services/api';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, sett] = await Promise.all([
          getCategories(),
          getSiteSettings()
        ]);
        setCategories(cats);
        setSettings(sett);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const scrollToAbout = (e) => {
    e.preventDefault();
    const aboutEl = document.getElementById('about-section');
    if (aboutEl) {
      aboutEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* 3. HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Left side: Content & CTAs */}
            <div className="hero-content">
              <span className="section-eyebrow">Architectural Hardware</span>
              <h1 className="hero-headline">
                Hardware That Makes Your Home{' '}
                <span className="highlight">Premium</span>,{' '}
                <span className="highlight">Secure</span> &amp; Long-Lasting.
              </h1>
              <p className="hero-subtext">
                {settings.hero_subtext ||
                  'Premium hardware designed to bring lasting strength, refined aesthetics, and dependable security to modern spaces.'}
              </p>
              <div className="hero-actions">
                <Link to="/collection" className="btn btn-primary">
                  <span>Explore Collection</span>
                  <ArrowRight size={16} />
                </Link>
                <a href="#about-section" onClick={scrollToAbout} className="btn btn-secondary">
                  <span>About Us</span>
                </a>
              </div>
            </div>

            {/* Right side: Large premium door handle image */}
            <div>
              <div className="hero-image-wrapper">
                <img
                  src="/images/hero_door_handle.jpg"
                  alt="Modern architectural door handle installed on a luxury fluted wooden door"
                  loading="eager"
                />
                <div className="hero-image-badge">
                  Installed Precision Fitting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOMEPAGE — COLLECTION INTRODUCTION */}
      <section className="section" id="collection-intro">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Exquisite Craftsmanship</span>
            <h2 className="section-title">Our Collection</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Explore thoughtfully selected hardware designed for modern homes, doors, interiors, and architectural spaces.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Loading architectural collections...
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((category) => (
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
                      <span>View Collection</span>
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/collection" className="btn btn-secondary">
              <span>View All Categories</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5 & 6. HOMEPAGE — ABOUT US & FOUR VALUE CARDS */}
      <section className="section about-section" id="about-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">The Brand</span>
            <h2 className="section-title">About Garg Traders</h2>
          </div>

          <div className="about-intro-box">
            <p className="about-intro-text">
              “{settings.about_company ||
                'Garg Traders is built around a simple idea — hardware should do more than complete a space. It should enhance it. We focus on hardware that combines refined design, dependable performance, security, and long-lasting quality.'}”
            </p>
          </div>

          {/* Four Value Cards */}
          <div className="value-cards-grid">
            {/* Card 1: Premium Design */}
            <div className="value-card">
              <div className="value-card-icon">
                <Sparkles size={22} />
              </div>
              <h3 className="value-card-title">Premium Design</h3>
              <p className="value-card-desc">
                Hardware designed to complement modern interiors and architectural spaces.
              </p>
            </div>

            {/* Card 2: Built to Last */}
            <div className="value-card">
              <div className="value-card-icon">
                <Award size={22} />
              </div>
              <h3 className="value-card-title">Built to Last</h3>
              <p className="value-card-desc">
                Products selected with durability and long-term everyday use in mind.
              </p>
            </div>

            {/* Card 3: Security & Reliability */}
            <div className="value-card">
              <div className="value-card-icon">
                <ShieldCheck size={22} />
              </div>
              <h3 className="value-card-title">Security &amp; Reliability</h3>
              <p className="value-card-desc">
                Hardware designed to provide dependable functionality and security.
              </p>
            </div>

            {/* Card 4: Trusted Experience (Editable statement) */}
            <div className="value-card">
              <div className="value-card-icon">
                <Clock size={22} />
              </div>
              <h3 className="value-card-title">Trusted Experience</h3>
              <p className="value-card-desc">
                {settings.established_statement ||
                  'Delivering architectural hardware excellence with enduring trust, precision engineering, and peerless craftsmanship.'}
              </p>
              <span className="value-card-badge">
                Established: [YEAR]
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Header({ onOpenAdminModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const clickTimerRef = useRef(null);

  // Hidden admin trigger on double-click
  const handleBrandClick = (e) => {
    e.preventDefault();

    if (clickTimerRef.current) {
      // Double-click detected!
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onOpenAdminModal();
    } else {
      // First click: wait briefly to distinguish from double-click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (location.pathname === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/');
        }
      }, 280);
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      const aboutEl = document.getElementById('about-section');
      if (aboutEl) {
        aboutEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#about');
      setTimeout(() => {
        const aboutEl = document.getElementById('about-section');
        if (aboutEl) {
          aboutEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand identity - pure text with hidden double-click admin access */}
        <a
          href="/"
          onClick={handleBrandClick}
          className="brand-identity"
          title="Garg Traders"
          aria-label="Garg Traders - Home"
        >
          Garg Traders
        </a>

        {/* Desktop Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <a
            href="#about"
            onClick={handleAboutClick}
            className="nav-link"
          >
            About
          </a>
          <Link
            to="/collection"
            className={`nav-link ${location.pathname.startsWith('/collection') ? 'active' : ''}`}
          >
            Collection
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <a
            href="#about"
            onClick={handleAboutClick}
            className="nav-link"
          >
            About
          </a>
          <Link
            to="/collection"
            className={`nav-link ${location.pathname.startsWith('/collection') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Collection
          </Link>
        </div>
      )}
    </header>
  );
}

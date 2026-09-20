import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToAbout = (e) => {
    e.preventDefault();
    const aboutEl = document.getElementById('about-section');
    if (aboutEl) {
      aboutEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#about';
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand & Statement */}
          <div>
            <div className="footer-brand-title">Garg Traders</div>
            <p className="footer-brand-desc">
              Premium Indian architectural hardware engineered to bring enduring strength, refined aesthetics, and dependable security to modern homes and architectural spaces.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="footer-nav-title">Navigation</div>
            <ul className="footer-nav-list">
              <li>
                <Link to="/" className="footer-nav-link">Home</Link>
              </li>
              <li>
                <a href="#about" onClick={scrollToAbout} className="footer-nav-link">About</a>
              </li>
              <li>
                <Link to="/collection" className="footer-nav-link">Collection</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div>
            &copy; {currentYear} Garg Traders. All rights reserved.
          </div>
          <div>
            Architectural Hardware & Design Solutions
          </div>
        </div>
      </div>
    </footer>
  );
}

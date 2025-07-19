import React, { useState } from 'react';
import Button from '../Button/Button';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const discordIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <a 
            href="#home" 
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
          >
            zapply
          </a>
          
          {/* Desktop Navigation */}
          <div className="nav-actions desktop-nav">
            <button
              className="nav-link"
              onClick={() => scrollToSection('companies')}
            >
              Companies
            </button>
            <button
              className="nav-link"
              onClick={() => scrollToSection('jobs')}
            >
              Jobs
            </button>
            <Button
              href="https://discord.gg/yKWw28q7Yq"
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
              icon={discordIcon}
            >
              Discord
            </Button>
            <Button
              href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply"
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="mobile-nav">
            <button
              className="mobile-nav-link"
              onClick={() => scrollToSection('jobs')}
            >
              Jobs
            </button>
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-content">
              <button 
                className="mobile-menu-item"
                onClick={() => scrollToSection('companies')}
              >
                <span className="mobile-menu-icon">🏢</span>
                Companies
              </button>
              <button 
                className="mobile-menu-item"
                onClick={() => scrollToSection('jobs')}
              >
                <span className="mobile-menu-icon">💼</span>
                Browse Jobs
              </button>
              <button 
                className="mobile-menu-item"
                onClick={() => scrollToSection('features')}
              >
                <span className="mobile-menu-icon">⚡</span>
                Features
              </button>
              <a 
                href="https://discord.gg/yKWw28q7Yq"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-menu-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mobile-menu-icon">{discordIcon}</span>
                Discord Community
              </a>
              <a 
                href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-menu-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mobile-menu-icon">⭐</span>
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
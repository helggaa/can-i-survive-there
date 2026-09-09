import React from 'react';
import { Compass, MapPin, Sparkles } from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentView: 'landing' | 'browse' | 'personalized';
  onSelectView: (view: 'landing' | 'browse' | 'personalized') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Brand Logo & Friendly Tagline */}
          <div
            className="logo-brand"
            onClick={() => onSelectView('landing')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectView('landing');
              }
            }}
          >
            <div className="logo-icon-wrap">
              <Compass size={22} strokeWidth={2.5} />
            </div>
            <div className="logo-title-group">
              <h1 className="logo-title">Can I Survive There?</h1>
              <div className="logo-tagline">
                Relocation &amp; Living Cost Guide for Students &amp; Workers
              </div>
            </div>
          </div>

          {/* Right Navigation & Controls */}
          <div className="navbar-controls-group">
            <CurrencySelector />
            <ThemeToggle />

            {/* Desktop Navigation Links */}
            <nav className="nav-links nav-links-desktop" aria-label="Desktop Navigation">
              <button
                type="button"
                className={`nav-btn ${currentView === 'landing' ? 'active' : ''}`}
                onClick={() => onSelectView('landing')}
                aria-current={currentView === 'landing' ? 'page' : undefined}
              >
                Overview
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'browse' ? 'active' : ''}`}
                onClick={() => onSelectView('browse')}
                aria-current={currentView === 'browse' ? 'page' : undefined}
              >
                Browse Cities
              </button>
              <button
                type="button"
                className={`nav-btn ${currentView === 'personalized' ? 'active' : ''}`}
                onClick={() => onSelectView('personalized')}
                aria-current={currentView === 'personalized' ? 'page' : undefined}
              >
                Personalized Match
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible on screens < 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="mobile-bottom-nav-container">
          <button
            type="button"
            className={`mobile-nav-btn ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => onSelectView('landing')}
            aria-current={currentView === 'landing' ? 'page' : undefined}
          >
            <Compass size={20} className="mobile-nav-icon" />
            <span className="mobile-nav-label">Overview</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${currentView === 'browse' ? 'active' : ''}`}
            onClick={() => onSelectView('browse')}
            aria-current={currentView === 'browse' ? 'page' : undefined}
          >
            <MapPin size={20} className="mobile-nav-icon" />
            <span className="mobile-nav-label">Browse</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${currentView === 'personalized' ? 'active' : ''}`}
            onClick={() => onSelectView('personalized')}
            aria-current={currentView === 'personalized' ? 'page' : undefined}
          >
            <Sparkles size={20} className="mobile-nav-icon" />
            <span className="mobile-nav-label">Match</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;


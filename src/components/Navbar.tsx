// src/components/Navbar.tsx
// Warm, clean navigation bar with student & worker relocation tagline

import React from 'react';
import { Compass } from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentView: 'landing' | 'browse' | 'personalized';
  onSelectView: (view: 'landing' | 'browse' | 'personalized') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo & Friendly Tagline */}
        <div className="logo-brand" onClick={() => onSelectView('landing')}>
          <div className="logo-icon-wrap">
            <Compass size={22} strokeWidth={2.5} />
          </div>
          <div className="logo-title-group">
            <h1>Can I Survive There?</h1>
            <div className="logo-tagline">
              Relocation & Living Cost Guide for Students & Workers
            </div>
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CurrencySelector />
          <ThemeToggle />

          <nav className="nav-links">
            <button
              className={`nav-btn ${currentView === 'landing' ? 'active' : ''}`}
              onClick={() => onSelectView('landing')}
            >
              Overview
            </button>
            <button
              className={`nav-btn ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => onSelectView('browse')}
            >
              Browse Cities
            </button>
            <button
              className={`nav-btn ${currentView === 'personalized' ? 'active' : ''}`}
              onClick={() => onSelectView('personalized')}
            >
              Personalized Match
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

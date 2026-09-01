// src/components/Navbar.tsx
// Navigation Bar with logo, mode switcher, and data confidence status

import React from 'react';
import { Compass } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'browse' | 'personalized';
  onSelectView: (view: 'landing' | 'browse' | 'personalized') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="logo-brand" onClick={() => onSelectView('landing')}>
          <div className="logo-icon">
            <Compass size={20} />
          </div>
          <span>Can I Survive There?</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => onSelectView('landing')}
          >
            Home
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
    </header>
  );
};

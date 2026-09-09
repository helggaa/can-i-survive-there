// src/App.tsx
// Main Application Container with UI/UX Pro Max Cyber-Fintech Design System

import { useState, useEffect } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { BrowseView } from './components/BrowseView';
import { PersonalizedView } from './components/PersonalizedView';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';

type ViewMode = 'landing' | 'browse' | 'personalized';

function getViewFromHash(): ViewMode {
  const clean = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (clean === 'browse') return 'browse';
  if (clean === 'personalized') return 'personalized';
  return 'landing';
}

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>(getViewFromHash);
  const [browseCityId, setBrowseCityId] = useState<string>('city-jakarta-01');

  // Sync hash changes from browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const targetView = getViewFromHash();
      setCurrentView(targetView);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: ViewMode) => {
    const hash = view === 'landing' ? '' : `#/${view}`;
    if (window.location.hash !== hash) {
      if (view === 'landing') {
        history.pushState(null, '', window.location.pathname);
      } else {
        window.location.hash = hash;
      }
    }

    const updateDom = () => {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Use native View Transitions API if supported
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(updateDom);
    } else {
      updateDom();
    }
  };

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <div className="app-layout">
          {/* Floating Navigation Header */}
          <Navbar currentView={currentView} onSelectView={navigateTo} />

          {/* Main Viewport */}
          <main className="main-content">
            <div key={currentView} className="view-container">
              {currentView === 'landing' && (
                <LandingView
                  onSelectBrowse={(cityId) => {
                    if (cityId) setBrowseCityId(cityId);
                    navigateTo('browse');
                  }}
                  onSelectPersonalized={() => navigateTo('personalized')}
                />
              )}

              {currentView === 'browse' && (
                <BrowseView
                  initialCityId={browseCityId}
                  onNavigatePersonalized={() => navigateTo('personalized')}
                />
              )}

              {currentView === 'personalized' && (
                <PersonalizedView
                  onBackToBrowse={() => navigateTo('browse')}
                />
              )}
            </div>
          </main>

          {/* Application Footer (High-Contrast, Zero Invisible Text) */}
          <footer className="app-footer">
            <div className="footer-container">
              <div className="footer-brand-row">
                <div className="footer-status-dot" />
                <span className="footer-brand-copy">
                  <strong className="footer-brand-title">Can I Survive There?</strong> — Open, sample-based living cost estimates.
                </span>
              </div>
              <div className="footer-meta-copy">
                Data sourced from OpenStreetMap, World Bank PPP benchmarks, and community submissions · Open-source
              </div>
            </div>
          </footer>
        </div>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;

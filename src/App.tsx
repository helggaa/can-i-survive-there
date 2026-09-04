// src/App.tsx
// Main Application Container

import { useState, useEffect } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { BrowseView } from './components/BrowseView';
import { PersonalizedView } from './components/PersonalizedView';

type ViewMode = 'landing' | 'browse' | 'personalized';

function getViewFromHash(): ViewMode {
  const clean = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (clean === 'browse') return 'browse';
  if (clean === 'personalized') return 'personalized';
  return 'landing';
}

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>(getViewFromHash);

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
    <div className="app-layout">
      {/* Sticky Header */}
      <Navbar currentView={currentView} onSelectView={navigateTo} />

      {/* Main Viewport */}
      <main className="main-content">
        <div key={currentView} className="view-container">
          {currentView === 'landing' && (
            <LandingView
              onSelectBrowse={() => navigateTo('browse')}
              onSelectPersonalized={() => navigateTo('personalized')}
            />
          )}

          {currentView === 'browse' && (
            <BrowseView
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

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <strong>Can I Survive There?</strong> — Free, open, confidence-aware cost intelligence.
          </div>
          <div>
            Built with OpenStreetMap & World Bank PPP Open Data · Zero tracking
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

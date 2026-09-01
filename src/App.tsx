// src/App.tsx
// Main Application Container

import { useState } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { BrowseView } from './components/BrowseView';
import { PersonalizedView } from './components/PersonalizedView';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'browse' | 'personalized'>('landing');

  return (
    <div className="app-layout">
      {/* Sticky Header */}
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Viewport */}
      <main className="main-content">
        {currentView === 'landing' && (
          <LandingView
            onSelectBrowse={() => setCurrentView('browse')}
            onSelectPersonalized={() => setCurrentView('personalized')}
          />
        )}

        {currentView === 'browse' && (
          <BrowseView
            onNavigatePersonalized={() => setCurrentView('personalized')}
          />
        )}

        {currentView === 'personalized' && (
          <PersonalizedView
            onBackToBrowse={() => setCurrentView('browse')}
          />
        )}
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

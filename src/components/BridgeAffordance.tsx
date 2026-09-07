// src/components/BridgeAffordance.tsx
// Sleek bridge affordance routing users from browse mode into personalized mode

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BridgeAffordanceProps {
  cityName: string;
  onNavigatePersonalized: () => void;
}

export const BridgeAffordance: React.FC<BridgeAffordanceProps> = ({
  cityName,
  onNavigatePersonalized,
}) => {
  return (
    <div className="bridge-card">
      <div className="bridge-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-secondary)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
          <Sparkles size={14} />
          <span>Find your ideal match</span>
        </div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Moving to or working in {cityName}?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          Input your monthly income and office location to rank every neighborhood by balanced commute time and real affordability.
        </p>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={onNavigatePersonalized}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1.4rem',
          fontSize: '0.9375rem',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span>Calculate Personalized Match</span>
        <ArrowRight size={17} />
      </button>
    </div>
  );
};

export default BridgeAffordance;

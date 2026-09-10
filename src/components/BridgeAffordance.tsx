// src/components/BridgeAffordance.tsx
// Survive Atlas — Premium glass CTA bridge to personalized mode

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
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          color: 'var(--brand-secondary)', fontSize: '0.75rem', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem',
        }}>
          <Sparkles size={13} />
          <span>Get a Personalized Match</span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800,
          letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '0.4rem',
        }}>
          Moving to or working in {cityName}?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Enter your monthly budget and campus or office address to rank every neighborhood by balanced commute time and real affordability.
        </p>
      </div>

      <button
        type="button"
        className="btn-primary btn-cta"
        onClick={onNavigatePersonalized}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.8rem 1.6rem', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        <span>Calculate My Match</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default BridgeAffordance;

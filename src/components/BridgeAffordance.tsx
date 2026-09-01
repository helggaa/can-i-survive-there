// src/components/BridgeAffordance.tsx
// Bridge affordance routing users from browse mode into personalized mode

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Sparkles size={15} />
          <span>Find your ideal neighborhood</span>
        </div>
        <h3>Working in or moving to {cityName}?</h3>
        <p>
          Enter your monthly salary and workplace address to calculate exact affordability and commute times across all areas.
        </p>
      </div>

      <button className="btn-primary" onClick={onNavigatePersonalized}>
        <span>Get a Personalized Match</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

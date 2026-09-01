// src/components/LandingView.tsx
// Landing Screen presenting two clear paths per 03-ux-screens.md (Section 1)

import React from 'react';
import { Compass, Sparkles, Shield, ArrowRight, MapPin, DollarSign, Users } from 'lucide-react';

interface LandingViewProps {
  onSelectBrowse: () => void;
  onSelectPersonalized: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSelectBrowse,
  onSelectPersonalized,
}) => {
  return (
    <div className="landing-container">
      {/* Hero */}
      <div className="landing-hero">
        <div className="hero-tag">
          <Sparkles size={14} />
          <span>100% Free & Open-Source Cost Intelligence</span>
        </div>

        <h1 className="hero-title">
          Can I Survive There?
        </h1>

        <p className="hero-desc">
          Honest, neighborhood-level cost-of-living data with transparent confidence ratings. 
          Discover affordable kosts, food, and commute routes near your workplace.
        </p>

        {/* Two Clear Unbiased Choices */}
        <div className="choice-cards-grid">
          {/* Choice 1: Browse Mode */}
          <div className="choice-card browse" onClick={onSelectBrowse}>
            <div className="choice-icon-wrap emerald">
              <Compass size={26} />
            </div>
            <h2 className="choice-title">Browse City Costs</h2>
            <p className="choice-body">
              Explore room/kost rent, sit-down food, and transport averages by neighborhood. 
              <strong> 100% private — no salary or personal details required.</strong>
            </p>
            <div className="choice-cta">
              <span>Explore Cities</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Choice 2: Personalized Mode */}
          <div className="choice-card personalized" onClick={onSelectPersonalized}>
            <div className="choice-icon-wrap cyan">
              <MapPin size={26} />
            </div>
            <h2 className="choice-title">Get a Personalized Match</h2>
            <p className="choice-body">
              Enter your monthly budget and workplace location. We'll score and rank the best affordable neighborhoods balanced against commute time.
            </p>
            <div className="choice-cta">
              <span>Match My Budget</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Philosophy Pillars */}
      <div style={{ marginTop: '3.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            <Shield size={18} />
            <span>Visible Confidence</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45 }}>
            Every cost displays an honest confidence rating based on real evidence. Low-confidence data is labeled, never silently hidden.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>
            <DollarSign size={18} />
            <span>Meals-Only Food Cost</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45 }}>
            Food calculations reflect real sit-down meals, explicitly excluding discretionary snacks and drinks for realistic budgets.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: 'var(--accent-tertiary)', fontWeight: 700 }}>
            <Users size={18} />
            <span>Wikipedia Facts</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45 }}>
            Observations from local residents are validated and blended via periodic median recalculations, resisting bad-faith edits.
          </p>
        </div>
      </div>
    </div>
  );
};

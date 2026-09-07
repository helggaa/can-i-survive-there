// src/components/LandingView.tsx
// Warm, welcoming relocation guide for students, migrants, and new arrivals

import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Shield,
  ArrowRight,
  MapPin,
  Utensils,
  GraduationCap,
  Briefcase,
  Users,
  ChevronDown,
  Home,
} from 'lucide-react';

interface LandingViewProps {
  onSelectBrowse: (cityId?: string) => void;
  onSelectPersonalized: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSelectBrowse,
  onSelectPersonalized,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const sampleCities = [
    { name: 'Yogyakarta', id: 'city-yogyakarta-02', country: '🇮🇩', cost: 'Rp 2.1M/mo', tag: 'Top Student Hub' },
    { name: 'Bandung', id: 'city-bandung-04', country: '🇮🇩', cost: 'Rp 2.8M/mo', tag: 'Campus & Creative' },
    { name: 'Jakarta', id: 'city-jakarta-01', country: '🇮🇩', cost: 'Rp 3.8M/mo', tag: 'Jobs & Capital' },
    { name: 'Surabaya', id: 'city-surabaya-03', country: '🇮🇩', cost: 'Rp 2.9M/mo', tag: 'Industry & Study' },
    { name: 'Tokyo', id: 'city-tokyo-05', country: '🇯🇵', cost: '¥ 145K/mo', tag: 'Global Study' },
    { name: 'Melbourne', id: 'city-melbourne-06', country: '🇦🇺', cost: 'A$ 2,200/mo', tag: 'Study Abroad' },
  ];

  const faqs = [
    {
      q: 'Who is this guide built for?',
      a: 'We built this specifically for university students moving to campus, migrant workers relocating to new cities, and fresh graduates planning their first independent apartment or kost.',
    },
    {
      q: 'How are the kost and room rents calculated?',
      a: 'We prioritize realistic single room and kost rents (not luxury high-rises). Prices are verified with actual local listings and crowdsourced reports from real students and residents.',
    },
    {
      q: 'What does "Meals-Only Food Cost" mean?',
      a: 'Instead of assuming expensive café visits, we model 3 authentic, everyday sit-down meals a day (like local warungs, campus canteens, and casual diners) across 30 days to give you an honest baseline for survival.',
    },
    {
      q: 'Is this service completely free and private?',
      a: 'Yes, 100% free and open-source. No login, no email, and no salary data collection. We never sell your data.',
    },
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="hero-tag">
          <GraduationCap size={16} />
          <span>Relocation & Living Cost Guide for Students & Workers</span>
        </div>

        <h1 className="hero-title">
          Moving somewhere new? Know before you pack.
        </h1>

        <p className="hero-desc">
          Honest room and kost rents, everyday street meal averages, and realistic commute times near your campus or workplace. Plan your survival budget with confidence.
        </p>

        {/* Persona Badges */}
        <div className="persona-pills-row">
          <div className="persona-pill">
            <GraduationCap size={14} style={{ color: 'var(--brand-primary)' }} />
            <span>Moving for College / University</span>
          </div>
          <div className="persona-pill">
            <Briefcase size={14} style={{ color: 'var(--brand-secondary)' }} />
            <span>Relocating for a New Job</span>
          </div>
          <div className="persona-pill">
            <Home size={14} style={{ color: 'var(--brand-warm)' }} />
            <span>First-Time Living Independently</span>
          </div>
        </div>

        {/* Live City Cost Ticker Chips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Popular Student & Worker Cities:
          </div>
          {sampleCities.map((item) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-xs)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => onSelectBrowse(item.id)}
            >
              <span>{item.country}</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.name}</strong>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{item.cost}</span>
            </div>
          ))}
        </div>

        {/* Dual Choice Path Cards */}
        <div className="choice-cards-grid">
          {/* Choice 1: Browse Mode */}
          <div className="choice-card" onClick={() => onSelectBrowse()}>
            <div>
              <div className="choice-icon-wrap browse-icon">
                <Compass size={28} />
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                <Shield size={12} /> 100% Anonymous & Free
              </div>
              <h2 className="choice-title">Browse City Survival Costs</h2>
              <p className="choice-body">
                Explore affordable kosts, local warung meals, and public transit passes neighborhood by neighborhood across 50,000+ cities worldwide.
              </p>
            </div>
            <div className="choice-cta">
              <span>Explore Cities</span>
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Choice 2: Personalized Mode */}
          <div className="choice-card" onClick={onSelectPersonalized}>
            <div>
              <div className="choice-icon-wrap personalized-icon">
                <MapPin size={28} />
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-secondary-light)', color: 'var(--brand-secondary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                <Sparkles size={12} /> Campus & Office Match
              </div>
              <h2 className="choice-title">Calculate My Move</h2>
              <p className="choice-body">
                Enter your monthly allowance or salary and your campus or office address. We will rank the most affordable neighborhoods with realistic commute routes.
              </p>
            </div>
            <div className="choice-cta" style={{ color: 'var(--brand-secondary)' }}>
              <span>Match My Budget</span>
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Philosophy Pillars */}
      <div className="trust-pillars-grid">
        <div className="trust-pillar-card">
          <div className="trust-pillar-header">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-secondary)' }}>
              <Home size={18} />
            </div>
            <span>Realistic Room & Kost Rates</span>
          </div>
          <p className="trust-pillar-text">
            We focus on genuine student kosts, single rooms, and shared apartments — not luxury high-rises. Every rate reflects realistic survival options.
          </p>
        </div>

        <div className="trust-pillar-card">
          <div className="trust-pillar-header">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-warm-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-warm)' }}>
              <Utensils size={18} />
            </div>
            <span>Everyday Meals Baseline</span>
          </div>
          <p className="trust-pillar-text">
            Calculated around 3 authentic local meals a day (campus canteens and neighborhood warungs), intentionally excluding discretionary snacks and drinks.
          </p>
        </div>

        <div className="trust-pillar-card">
          <div className="trust-pillar-header">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <Users size={18} />
            </div>
            <span>Resident Verified</span>
          </div>
          <p className="trust-pillar-text">
            Data is continuously verified and calibrated by students and locals living in those exact neighborhoods, blended to resist false or outdated claims.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: '760px', margin: '4rem auto 0' }}>
        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </div>
                {isOpen && (
                  <p style={{ marginTop: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingView;

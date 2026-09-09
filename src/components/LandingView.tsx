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
      a: 'We prioritize entry-level single room and kost rents. Estimates are calculated from local listings, OpenStreetMap geodata, and crowdsourced community submissions.',
    },
    {
      q: 'What does "Meals-Only Food Cost" mean?',
      a: 'Instead of assuming discretionary dining, we model 3 everyday sit-down meals a day (such as local warungs, campus canteens, and casual eateries) across 30 days to outline an entry-level meal baseline.',
    },
    {
      q: 'Is this service free to access?',
      a: 'Yes, free and open-source. Runs client-side without registration, accounts, or tracker cookies.',
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
          Room and kost rent estimates, everyday meal averages, and calculated commute times near your campus or workplace. Plan your relocation budget with sample-based data.
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
        <div className="landing-city-ticker-container">
          <div className="landing-city-ticker-title">
            Popular Student &amp; Worker Cities:
          </div>
          <div className="landing-city-chips-wrap">
            {sampleCities.map((item) => (
              <button
                key={item.name}
                type="button"
                className="landing-city-chip"
                onClick={() => onSelectBrowse(item.id)}
              >
                <span>{item.country}</span>
                <strong className="city-chip-name">{item.name}</strong>
                <span className="city-chip-cost">{item.cost}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dual Choice Path Cards */}
        <div className="choice-cards-grid">
          {/* Choice 1: Browse Mode */}
          <div
            className="choice-card"
            onClick={() => onSelectBrowse()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectBrowse();
              }
            }}
          >
            <div>
              <div className="choice-icon-wrap browse-icon">
                <Compass size={28} />
              </div>
              <div className="choice-badge-wrap browse-badge">
                <Shield size={12} /> Open-Access Cost Data
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
          <div
            className="choice-card"
            onClick={onSelectPersonalized}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectPersonalized();
              }
            }}
          >
            <div>
              <div className="choice-icon-wrap personalized-icon">
                <MapPin size={28} />
              </div>
              <div className="choice-badge-wrap personalized-badge">
                <Sparkles size={12} /> Campus &amp; Office Match
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
            <div className="pillar-icon-box secondary">
              <Home size={18} />
            </div>
            <span>Single Room &amp; Kost Benchmarks</span>
          </div>
          <p className="trust-pillar-text">
            We focus on entry-level student kosts, single rooms, and shared apartments — not luxury high-rises. Rates reflect reported entry options.
          </p>
        </div>

        <div className="trust-pillar-card">
          <div className="trust-pillar-header">
            <div className="pillar-icon-box warm">
              <Utensils size={18} />
            </div>
            <span>Everyday Meals Baseline</span>
          </div>
          <p className="trust-pillar-text">
            Calculated around 3 everyday local meals a day (campus canteens and neighborhood warungs), intentionally excluding discretionary snacks and drinks.
          </p>
        </div>

        <div className="trust-pillar-card">
          <div className="trust-pillar-header">
            <div className="pillar-icon-box primary">
              <Users size={18} />
            </div>
            <span>Community Submissions</span>
          </div>
          <p className="trust-pillar-text">
            Estimates combine open data benchmarks with user-submitted facts, prices, and evidence links from residents in those neighborhoods.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h3 className="faq-title">
          Frequently Asked Questions
        </h3>
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenFaqIndex(isOpen ? null : index);
                  }
                }}
              >
                <div className="faq-header">
                  <span className="faq-question">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${isOpen ? 'open' : ''}`}
                  />
                </div>
                {isOpen && (
                  <p className="faq-answer">
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


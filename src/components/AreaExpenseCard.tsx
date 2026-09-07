// src/components/AreaExpenseCard.tsx
// Warm, approachable, and transparent expense card designed for students, workers, and migrants

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Home,
  Bus,
  Utensils,
  ShoppingBasket,
  PlusCircle,
  CheckCircle2,
  Car,
  Bike,
  Footprints,
  AlertTriangle,
  Clock,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Award,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { AreaExpenseBreakdown, CommuteMode, Submission } from '../types/database.types';
import { db } from '../services/database';
import { ConfidenceBadge } from './ConfidenceBadge';
import { formatCurrency } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';

interface AreaExpenseCardProps {
  data: AreaExpenseBreakdown;
  rank: number;
  isPersonalized?: boolean;
  isTopRecommendation?: boolean;
  salary?: number;
  onOpenSubmitFact: (area: AreaExpenseBreakdown) => void;
  onOpenFeedback?: (area: AreaExpenseBreakdown) => void;
}

export const AreaExpenseCard: React.FC<AreaExpenseCardProps> = ({
  data,
  rank,
  isPersonalized = false,
  isTopRecommendation = false,
  salary,
  onOpenSubmitFact,
  onOpenFeedback,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(rank === 1);
  const [showFactsDrawer, setShowFactsDrawer] = useState<boolean>(false);
  const [areaSubmissions, setAreaSubmissions] = useState<Submission[]>([]);
  const [selectedCommuteMode, setSelectedCommuteMode] = useState<CommuteMode>(
    data.commute?.mode || 'drive'
  );

  const { formatPrice } = useCurrency();
  const currency = data.country?.currency_code || 'IDR';
  const formattedTotal = formatPrice(data.total_monthly_cost, currency);
  const formattedRent = formatPrice(data.rent_or_kost_monthly, currency);
  const formattedFood = formatPrice(data.food_cost_monthly, currency);
  const formattedMeal = formatPrice(data.food_meal_avg, currency);
  const formattedTransport = formatPrice(data.transport_monthly, currency);
  const formattedGrocery = formatPrice(data.grocery_monthly, currency);

  const affordabilityPct =
    salary && salary > 0 ? Math.round((data.total_monthly_cost / salary) * 100) : null;
  const isUnaffordable = affordabilityPct !== null && affordabilityPct >= 100;

  useEffect(() => {
    if (showFactsDrawer) {
      db.getAreaSubmissions(data.area.id).then((subs) => {
        setAreaSubmissions(subs);
      });
    }
  }, [showFactsDrawer, data.area.id]);

  const getModeIcon = (mode: CommuteMode) => {
    switch (mode) {
      case 'drive':
        return <Car size={14} />;
      case 'bike':
        return <Bike size={14} />;
      case 'transit':
        return <Bus size={14} />;
      case 'walk':
        return <Footprints size={14} />;
    }
  };

  const selectedCommuteDetail = data.commute?.available_modes.find(
    (m: any) => m.mode === selectedCommuteMode
  );

  // Proportional expense breakdown percentages for visual bar
  const total = Math.max(data.total_monthly_cost, 1);
  const rentPct = Math.round((data.rent_or_kost_monthly / total) * 100) || 45;
  const foodPct = Math.round((data.food_cost_monthly / total) * 100) || 35;
  const transitPct = Math.max(0, 100 - rentPct - foodPct);

  return (
    <div className={`area-card fade-in-card ${isUnaffordable ? 'unaffordable' : ''}`}>
      {/* Top Recommendation Integrated Ribbon */}
      {isTopRecommendation && (
        <div className="top-recommendation-ribbon">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={14} />
            <span>#1 Top Recommended Match for Your Relocation</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
            Optimal Balance of Rent &amp; Commute
          </span>
        </div>
      )}

      {/* Collapsed Summary Header */}
      <div
        className="area-card-summary"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="area-info-main">
          {/* Rank Badge */}
          <div className={`area-rank-badge ${rank === 1 ? 'top-rank' : ''}`}>
            {rank === 1 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Award size={14} style={{ color: 'var(--brand-warm)' }} />1
              </span>
            ) : (
              `#${rank}`
            )}
          </div>

          <div className="area-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3>{data.area.name}</h3>
              {isPersonalized && data.score && (
                <span className="match-score-badge" title={`Overall Match Score: ${Math.round(data.score.final_score * 100)}%`}>
                  <Sparkles size={12} />
                  <span>{Math.round(data.score.final_score * 100)}% Match</span>
                </span>
              )}
              {isPersonalized && affordabilityPct !== null && (
                <span className={`affordability-badge ${isUnaffordable ? 'unaffordable' : 'affordable'}`}>
                  {isUnaffordable ? '⚠️ ' : '✓ '}
                  {affordabilityPct}% of budget
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
              <MapPin size={13} style={{ color: 'var(--brand-primary)' }} />
              <span>{data.city.name}, {data.country.name}</span>
            </div>

            {/* Proportional Expense Breakdown Bar with Clean Labels */}
            <div className="expense-breakdown-bar-wrap">
              <div
                className="expense-breakdown-bar"
                title={`Kost: ${rentPct}% | Food: ${foodPct}% | Commute/Other: ${transitPct}%`}
              >
                <div className="breakdown-bar-segment rent" style={{ width: `${rentPct}%` }} />
                <div className="breakdown-bar-segment food" style={{ width: `${foodPct}%` }} />
                <div className="breakdown-bar-segment transit" style={{ width: `${transitPct}%` }} />
              </div>
              <div className="breakdown-legend-row">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--brand-secondary)' }} />
                  <span>Kost {rentPct}%</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--brand-warm)' }} />
                  <span>Food {foodPct}%</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--brand-commute)' }} />
                  <span>Transit {transitPct}%</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost & Metrics Preview */}
        <div className="area-price-group">
          {/* Commute Time Preview if Personalized */}
          {isPersonalized && data.commute && (
            <div className="commute-preview-badge">
              {getModeIcon(data.commute.mode)}
              <span>{data.commute.duration_min} min commute</span>
            </div>
          )}

          {/* Living Cost Amount */}
          <div>
            <div className="area-price-sublabel">Est. Living Cost</div>
            <div className="area-price-total">
              {data.total_monthly_cost > 0 ? (
                <>
                  <span>{formattedTotal.primary}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 3 }}>/mo</span>
                  {formattedTotal.isConverted && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {formattedTotal.secondary}
                    </div>
                  )}
                </>
              ) : (
                <div className="skeleton" style={{ width: 85, height: 20, display: 'inline-block' }} />
              )}
            </div>
          </div>

          <ConfidenceBadge confidence={data.confidence} sampleSize={data.sample_size} />

          <div
            style={{
              color: 'var(--text-secondary)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-alt)',
            }}
          >
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="area-card-expanded">
          {/* 4 Spacious Breakdown Tiles Grid (No squishing, no wrapping bugs) */}
          <div className="breakdown-tiles-grid">
            {/* 1. Housing / Kost */}
            <div className="breakdown-tile">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="tile-icon-badge" style={{ background: 'var(--brand-secondary-light)', color: 'var(--brand-secondary)' }}>
                    <Home size={18} />
                  </div>
                  {data.metric_values['rent_or_kost_monthly'] && (
                    <ConfidenceBadge
                      confidence={data.metric_values['rent_or_kost_monthly'].confidence}
                      sampleSize={data.metric_values['rent_or_kost_monthly'].sample_size}
                      compact
                    />
                  )}
                </div>
                <div className="tile-title">Kost & Room Rent</div>
                <div className="tile-price">
                  <span>{formattedRent.primary}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>/mo</span>
                </div>
              </div>
              <div className="tile-desc">Single room or student kost baseline average</div>
            </div>

            {/* 2. Food & Local Meals */}
            <div className="breakdown-tile">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="tile-icon-badge" style={{ background: 'var(--brand-warm-light)', color: 'var(--brand-warm)' }}>
                    <Utensils size={18} />
                  </div>
                  {data.metric_values['food_meal_avg'] && (
                    <ConfidenceBadge
                      confidence={data.metric_values['food_meal_avg'].confidence}
                      sampleSize={data.metric_values['food_meal_avg'].sample_size}
                      compact
                    />
                  )}
                </div>
                <div className="tile-title">Warung & Daily Meals</div>
                <div className="tile-price">
                  <span>{formattedFood.primary}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>/mo</span>
                </div>
              </div>
              <div className="tile-desc">
                ~{formattedMeal.primary}/meal · 3 daily authentic canteen or warung meals
              </div>
            </div>

            {/* 3. Transit & Commute */}
            <div className="breakdown-tile">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="tile-icon-badge" style={{ background: 'var(--brand-commute-light)', color: 'var(--brand-commute)' }}>
                    <Bus size={18} />
                  </div>
                  {data.metric_values['transport_monthly'] && (
                    <ConfidenceBadge
                      confidence={data.metric_values['transport_monthly'].confidence}
                      sampleSize={data.metric_values['transport_monthly'].sample_size}
                      compact
                    />
                  )}
                </div>
                <div className="tile-title">Transit & Commute</div>
                <div className="tile-price">
                  <span>{formattedTransport.primary}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>/mo</span>
                </div>
              </div>
              <div className="tile-desc">Local commuter rail, busway passes, or daily commute trips</div>
            </div>

            {/* 4. Groceries & Supplies */}
            <div className="breakdown-tile">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="tile-icon-badge" style={{ background: 'var(--brand-grocery-light)', color: 'var(--brand-grocery)' }}>
                    <ShoppingBasket size={18} />
                  </div>
                  {data.metric_values['grocery_basket'] && (
                    <ConfidenceBadge
                      confidence={data.metric_values['grocery_basket'].confidence}
                      sampleSize={data.metric_values['grocery_basket'].sample_size}
                      compact
                    />
                  )}
                </div>
                <div className="tile-title">Groceries & Essentials</div>
                <div className="tile-price">
                  <span>{formattedGrocery.primary}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>/mo</span>
                </div>
              </div>
              <div className="tile-desc">Household toiletries, drinking water, and weekly student staples</div>
            </div>
          </div>

          {/* Commute Section (Personalized Mode) */}
          {isPersonalized && data.commute && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.25rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.85rem',
                }}
              >
                <Navigation size={16} color="var(--brand-primary)" />
                <span>Commute to Workplace or Campus ({data.commute.distance_km} km away)</span>
              </div>

              {/* Commute Mode Selector */}
              <div className="commute-mode-bar">
                {data.commute.available_modes.map((modeDetail: any) => (
                  <button
                    key={modeDetail.mode}
                    type="button"
                    disabled={!modeDetail.is_available}
                    onClick={() => setSelectedCommuteMode(modeDetail.mode)}
                    className={`commute-mode-pill ${selectedCommuteMode === modeDetail.mode ? 'active' : ''}`}
                  >
                    {getModeIcon(modeDetail.mode)}
                    <span style={{ textTransform: 'capitalize' }}>{modeDetail.mode}</span>
                    {modeDetail.is_available && (
                      <span style={{ opacity: 0.85, fontWeight: 700 }}>({modeDetail.duration_min} min)</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Selected Mode Detail */}
              {selectedCommuteDetail && (
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: selectedCommuteDetail.is_available
                      ? 'var(--text-secondary)'
                      : 'var(--accent-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    marginTop: '0.75rem',
                  }}
                >
                  {selectedCommuteDetail.is_available ? (
                    <Clock size={14} color="var(--brand-primary)" />
                  ) : (
                    <AlertTriangle size={14} color="var(--accent-warning)" />
                  )}
                  <span>
                    {selectedCommuteDetail.status_note ||
                      `Estimated travel duration: ${selectedCommuteDetail.duration_min} min`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Verified Facts & Sources Inspector */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowFactsDrawer(!showFactsDrawer)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                <ShieldCheck size={16} />
                <span>Verified Facts & Sources ({data.sample_size} observations)</span>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {showFactsDrawer ? 'Hide Sources ▲' : 'Inspect Sources ▼'}
              </span>
            </div>

            {showFactsDrawer && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                {areaSubmissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {areaSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          background: 'var(--bg-surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 1rem',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub.note || 'Community Observation'}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-sans)' }}>
                            {formatCurrency(sub.value, currency)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span>
                            Source: <strong style={{ color: 'var(--text-secondary)' }}>{sub.source_type}</strong> · Observed {sub.observed_at}
                          </span>
                          {sub.evidence_url && (sub.evidence_url.startsWith('http://') || sub.evidence_url.startsWith('https://')) && (
                            <a
                              href={sub.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>View evidence</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Loading factual observations...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Area Card Footer: Citations & Action Buttons */}
          <div className="area-card-footer">
            <div className="card-citations">
              <span className="citation-tag">
                <CheckCircle2 size={13} color="var(--brand-secondary)" />
                <span>OpenStreetMap Verified</span>
              </span>
              <span>·</span>
              <span className="citation-tag">
                <span>World Bank PPP Synthesis</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSubmitFact(data);
                }}
              >
                <PlusCircle size={14} />
                <span>Submit Fact</span>
              </button>

              {onOpenFeedback && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.8125rem',
                    background: 'var(--brand-primary-light)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--brand-primary)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFeedback(data);
                  }}
                >
                  <span>Report Update</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaExpenseCard;

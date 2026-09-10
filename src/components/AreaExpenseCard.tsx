// src/components/AreaExpenseCard.tsx
// Survive Atlas — Premium glassmorphic area expense card with stagger animation

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
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { AreaExpenseBreakdown, CommuteMode, Submission } from '../types/database.types';
import { db } from '../services/database';
import { ConfidenceBadge } from './ConfidenceBadge';
import { useCurrency } from '../context/CurrencyContext';
import { sanitizeExternalLink } from '../utils/security';

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
  const [isExpanded, setIsExpanded]           = useState<boolean>(rank === 1);
  const [showFactsDrawer, setShowFactsDrawer] = useState<boolean>(false);
  const [areaSubmissions, setAreaSubmissions] = useState<Submission[]>([]);
  const [selectedCommuteMode, setSelectedCommuteMode] = useState<CommuteMode>(
    data.commute?.mode || 'drive'
  );

  const { formatPrice } = useCurrency();
  const currency          = data.country?.currency_code || 'IDR';
  const formattedTotal    = formatPrice(data.total_monthly_cost, currency);
  const formattedRent     = formatPrice(data.rent_or_kost_monthly, currency);
  const formattedFood     = formatPrice(data.food_cost_monthly, currency);
  const formattedMeal     = formatPrice(data.food_meal_avg, currency);
  const formattedTransport = formatPrice(data.transport_monthly, currency);
  const formattedGrocery  = formatPrice(data.grocery_monthly, currency);

  const affordabilityPct =
    salary && salary > 0 ? Math.round((data.total_monthly_cost / salary) * 100) : null;
  const isUnaffordable = affordabilityPct !== null && affordabilityPct >= 100;

  useEffect(() => {
    if (showFactsDrawer) {
      db.getAreaSubmissions(data.area.id).then((subs) => setAreaSubmissions(subs));
    }
  }, [showFactsDrawer, data.area.id]);

  const getModeIcon = (mode: CommuteMode) => {
    switch (mode) {
      case 'drive':   return <Car size={14} />;
      case 'bike':    return <Bike size={14} />;
      case 'transit': return <Bus size={14} />;
      case 'walk':    return <Footprints size={14} />;
    }
  };

  const selectedCommuteDetail = data.commute?.available_modes.find(
    (m: any) => m.mode === selectedCommuteMode
  );

  // Proportional expense bars
  const total    = Math.max(data.total_monthly_cost, 1);
  const rentPct  = Math.round((data.rent_or_kost_monthly / total) * 100) || 45;
  const foodPct  = Math.round((data.food_cost_monthly   / total) * 100) || 35;
  const transitPct = Math.round((data.transport_monthly  / total) * 100) || 10;
  const groceryPct = Math.max(0, 100 - rentPct - foodPct - transitPct);

  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

  return (
    <div className={`area-card stagger-item ${isTopRecommendation ? 'top-pick' : ''} ${isUnaffordable ? 'area-card-unaffordable' : ''}`} style={{ position: 'relative' }}>

      {/* Top-pick banner */}
      {isTopRecommendation && (
        <div className="top-pick-banner">
          <Sparkles size={13} />
          <span>#1 Highest Scored Neighborhood · Based on commute &amp; budget formula</span>
        </div>
      )}

      {/* Summary row — collapsed view */}
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
        <div className="area-summary-top">
          {/* Area identity */}
          <div className="area-title-cluster">
            <div className={`area-rank-badge ${rankClass}`}>
              #{rank}
            </div>
            <div className="area-heading-text">
              <div className="area-name-row">
                <h3 className="area-name">{data.area.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <MapPin size={11} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <span className="area-city-country">{data.city.name}, {data.country.name}</span>
              </div>
            </div>
          </div>

          {/* Cost + expand */}
          <div className="area-cost-cluster">
            <div className="area-cost-amount-block">
              <div className="area-price-sublabel">Est. Living Cost</div>
              <div className={`area-price-total ${isUnaffordable ? 'unaffordable' : ''}`}>
                {data.total_monthly_cost > 0 ? (
                  <>
                    <span>{formattedTotal.primary}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                    {formattedTotal.isConverted && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '1px' }}>
                        {formattedTotal.secondary}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="skeleton" style={{ width: 85, height: 22 }} />
                )}
              </div>
            </div>

            <div
              className="area-expand-btn"
              aria-hidden="true"
            >
              <ChevronDown
                size={17}
                className={`area-expand-chevron ${isExpanded ? 'expanded' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="area-badges-row">
          {data.area.source === 'modeled' && (
            <span
              className="area-badge"
              style={{
                background: 'rgba(234, 179, 8, 0.12)',
                color: '#ca8a04',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '6px',
              }}
              title="Centroid quadrant fallback with modeled estimates"
            >
              Modeled District
            </span>
          )}

          {isPersonalized && data.score && (
            <span
              className="area-badge"
              style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', border: '1px solid rgba(59,130,246,0.25)' }}
              title={`Match Score: ${Math.round(data.score.final_score * 100)}%`}
            >
              <Sparkles size={11} />
              {Math.round(data.score.final_score * 100)}% Match
            </span>
          )}

          {isPersonalized && affordabilityPct !== null && (
            <span className={`affordability-tag ${isUnaffordable ? 'over' : affordabilityPct >= 80 ? 'tight' : 'safe'}`}>
              {isUnaffordable ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
              {affordabilityPct}% of budget
            </span>
          )}

          {isPersonalized && data.commute && (
            <span
              className="area-badge transit"
              style={{ border: '1px solid rgba(129,140,248,0.25)' }}
            >
              {getModeIcon(data.commute.mode)}
              {data.commute.duration_min} min commute
            </span>
          )}

          <ConfidenceBadge confidence={data.confidence} sampleSize={data.sample_size} />
        </div>

        {/* Expense bar */}
        <div className="expense-breakdown-bar-wrap">
          <div
            className="breakdown-bar-track"
            title={`Kost: ${rentPct}% | Food: ${foodPct}% | Transit: ${transitPct}% | Grocery: ${groceryPct}%`}
          >
            <div className="breakdown-bar-segment rent"    style={{ width: `${rentPct}%` }} />
            <div className="breakdown-bar-segment food"    style={{ width: `${foodPct}%` }} />
            <div className="breakdown-bar-segment transit" style={{ width: `${transitPct}%` }} />
            <div className="breakdown-bar-segment grocery" style={{ width: `${groceryPct}%` }} />
          </div>
          <div className="breakdown-legend-row">
            {[
              { label: `Kost ${rentPct}%`,    color: 'var(--brand-secondary)' },
              { label: `Food ${foodPct}%`,     color: 'var(--brand-warm)' },
              { label: `Transit ${transitPct}%`, color: 'var(--brand-commute)' },
              { label: `Grocery ${groceryPct}%`, color: 'var(--brand-grocery)' },
            ].map(({ label, color }) => (
              <span key={label} className="breakdown-legend-item">
                <span className="breakdown-dot" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="area-card-details">
          {/* 4 expense tiles */}
          <div className="expense-rows-grid">
            {/* Rent */}
            <div className="expense-row-card">
              <div className="expense-row-icon rent">
                <Home size={17} />
              </div>
              <div>
                <div className="expense-row-label">Kost &amp; Room Rent</div>
                <div className="expense-row-value">{formattedRent.primary}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                <div className="expense-row-sub">Single room or student kost baseline</div>
              </div>
              {data.metric_values?.['rent_or_kost_monthly'] && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <ConfidenceBadge
                    confidence={data.metric_values['rent_or_kost_monthly'].confidence}
                    sampleSize={data.metric_values['rent_or_kost_monthly'].sample_size}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Food */}
            <div className="expense-row-card">
              <div className="expense-row-icon food">
                <Utensils size={17} />
              </div>
              <div>
                <div className="expense-row-label">Warung &amp; Daily Meals</div>
                <div className="expense-row-value">{formattedFood.primary}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                <div className="expense-row-sub">~{formattedMeal.primary}/meal · 3 meals daily</div>
              </div>
              {data.metric_values?.['food_meal_avg'] && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <ConfidenceBadge
                    confidence={data.metric_values['food_meal_avg'].confidence}
                    sampleSize={data.metric_values['food_meal_avg'].sample_size}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Transit */}
            <div className="expense-row-card">
              <div className="expense-row-icon transit">
                <Bus size={17} />
              </div>
              <div>
                <div className="expense-row-label">Transit &amp; Commute</div>
                <div className="expense-row-value">{formattedTransport.primary}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                <div className="expense-row-sub">Commuter rail, busway, or daily trips</div>
              </div>
              {data.metric_values?.['transport_monthly'] && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <ConfidenceBadge
                    confidence={data.metric_values['transport_monthly'].confidence}
                    sampleSize={data.metric_values['transport_monthly'].sample_size}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Grocery */}
            <div className="expense-row-card">
              <div className="expense-row-icon grocery">
                <ShoppingBasket size={17} />
              </div>
              <div>
                <div className="expense-row-label">Groceries &amp; Essentials</div>
                <div className="expense-row-value">{formattedGrocery.primary}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                <div className="expense-row-sub">Household basics &amp; weekly staples</div>
              </div>
              {data.metric_values?.['grocery_basket'] && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <ConfidenceBadge
                    confidence={data.metric_values['grocery_basket'].confidence}
                    sampleSize={data.metric_values['grocery_basket'].sample_size}
                    compact
                  />
                </div>
              )}
            </div>
          </div>

          {/* Commute detail (personalized mode) */}
          {isPersonalized && data.commute && (
            <div className="commute-section">
              <div className="commute-section-title">
                <Navigation size={12} />
                Commute to Workplace ({data.commute.distance_km} km)
              </div>
              <div className="commute-mode-tabs">
                {data.commute.available_modes.map((modeDetail: any) => (
                  <button
                    key={modeDetail.mode}
                    type="button"
                    disabled={!modeDetail.is_available}
                    onClick={() => setSelectedCommuteMode(modeDetail.mode)}
                    className={`commute-mode-btn ${selectedCommuteMode === modeDetail.mode ? 'active' : ''}`}
                  >
                    {getModeIcon(modeDetail.mode)}
                    <span style={{ textTransform: 'capitalize' }}>{modeDetail.mode}</span>
                    {modeDetail.is_available && (
                      <span style={{ fontWeight: 700 }}>{modeDetail.duration_min} min</span>
                    )}
                  </button>
                ))}
              </div>

              {selectedCommuteDetail && (
                <div className="commute-info-row" style={{ marginTop: '0.75rem' }}>
                  <span className="commute-detail-chip">
                    {selectedCommuteDetail.is_available
                      ? <Clock size={13} style={{ color: 'var(--brand-primary)' }} />
                      : <AlertTriangle size={13} style={{ color: 'var(--accent-warning)' }} />}
                    <span style={{ color: selectedCommuteDetail.is_available ? 'var(--text-secondary)' : 'var(--accent-warning)' }}>
                      {selectedCommuteDetail.status_note ||
                        `Estimated travel: ${selectedCommuteDetail.duration_min} min`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sources & evidence inspector */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.1rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setShowFactsDrawer(!showFactsDrawer)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowFactsDrawer(!showFactsDrawer); } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                <ShieldCheck size={15} />
                Sources &amp; Evidence ({data.sample_size} observations)
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {showFactsDrawer ? 'Hide ▲' : 'Inspect ▼'}
              </span>
            </div>

            {showFactsDrawer && (
              <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}>
                {areaSubmissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {areaSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          background: 'var(--bg-surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub.note || 'Sample observation'}: {sub.value.toLocaleString()} {data.country.currency_code}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', padding: '0.15rem 0.45rem', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                            {sub.source_type}
                          </span>
                          {(() => {
                            const safeLink = sanitizeExternalLink(sub.evidence_url);
                            if (!safeLink) return null;
                            return (
                              <a
                                href={safeLink}
                                target="_blank"
                                rel="noreferrer noopener"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}
                              >
                                <ExternalLink size={11} />
                                Source
                              </a>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Loading factual observations…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card action buttons */}
          <div className="area-card-actions-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={11} style={{ color: 'var(--brand-secondary)' }} />
              OpenStreetMap · World Bank PPP Benchmark
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="area-action-btn submit-fact"
                onClick={(e) => { e.stopPropagation(); onOpenSubmitFact(data); }}
              >
                <PlusCircle size={13} />
                Submit Fact
              </button>
              {onOpenFeedback && (
                <button
                  type="button"
                  className="area-action-btn"
                  onClick={(e) => { e.stopPropagation(); onOpenFeedback(data); }}
                >
                  Report Update
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

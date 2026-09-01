// src/components/AreaExpenseCard.tsx
// Expandable area card per 03-ux-screens.md (Browse, Personalized, and Area Detail) with Fact Inspection Drawer

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
} from 'lucide-react';
import type { AreaExpenseBreakdown, CommuteMode, Submission } from '../types/database.types';
import { db } from '../services/database';
import { ConfidenceBadge } from './ConfidenceBadge';

interface AreaExpenseCardProps {
  data: AreaExpenseBreakdown;
  rank: number;
  isPersonalized?: boolean;
  salary?: number;
  onOpenSubmitFact: (area: AreaExpenseBreakdown) => void;
}

import { formatCurrency } from '../utils/formatters';

export const AreaExpenseCard: React.FC<AreaExpenseCardProps> = ({
  data,
  rank,
  isPersonalized = false,
  salary,
  onOpenSubmitFact,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(rank === 1);
  const [showFactsDrawer, setShowFactsDrawer] = useState<boolean>(false);
  const [areaSubmissions, setAreaSubmissions] = useState<Submission[]>([]);
  const [selectedCommuteMode, setSelectedCommuteMode] = useState<CommuteMode>(
    data.commute?.mode || 'drive'
  );

  const currency = data.country?.currency_code || 'IDR';
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

  return (
    <div
      className="area-card"
      style={
        isUnaffordable
          ? { borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.04)' }
          : undefined
      }
    >
      {/* Collapsed Summary */}
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
          <div className={`area-rank-badge ${rank === 1 ? 'top-rank' : ''}`}>
            #{rank}
          </div>
          <div className="area-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3>{data.area.name}</h3>
              {isPersonalized && affordabilityPct !== null && (
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isUnaffordable
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    color: isUnaffordable ? 'var(--accent-danger)' : 'var(--accent-primary)',
                    border: `1px solid ${
                      isUnaffordable ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                    }`,
                  }}
                >
                  {isUnaffordable ? '⚠️ ' : ''}
                  {affordabilityPct}% of salary
                </span>
              )}
            </div>
            <div className="area-location-sub">
              {data.city.name}, {data.country.name}
            </div>
          </div>
        </div>

        <div className="area-cost-preview">
          {/* Commute Time Preview if Personalized */}
          {isPersonalized && data.commute && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.875rem',
                color: 'var(--accent-secondary)',
                fontWeight: 600,
              }}
            >
              {getModeIcon(data.commute.mode)}
              <span>{data.commute.duration_min} min</span>
            </div>
          )}

          {/* Living Cost */}
          <div className="total-cost-display">
            <div className="cost-label">Est. Living Cost</div>
            <div className="cost-amount">
              {formatCurrency(data.total_monthly_cost, currency)}
              <span className="cost-currency">/mo</span>
            </div>
          </div>

          <ConfidenceBadge confidence={data.confidence} sampleSize={data.sample_size} />

          <div className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="area-breakdown-panel">
          {/* Living Cost Grid */}
          <div className="breakdown-grid">
            {/* Housing / Kost */}
            <div className="metric-item-box">
              <div className="metric-header">
                <div className="metric-title">
                  <Home size={15} color="#10b981" />
                  <span>Kost / Dorm Rent</span>
                </div>
                {data.metric_values['rent_or_kost_monthly'] && (
                  <ConfidenceBadge
                    confidence={data.metric_values['rent_or_kost_monthly'].confidence}
                    sampleSize={data.metric_values['rent_or_kost_monthly'].sample_size}
                  />
                )}
              </div>
              <div className="metric-value">
                {formatCurrency(data.rent_or_kost_monthly, currency)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div className="metric-note">Single room or shared kost average</div>
            </div>

            {/* Food (Meals Only) */}
            <div className="metric-item-box">
              <div className="metric-header">
                <div className="metric-title">
                  <Utensils size={15} color="#06b6d4" />
                  <span>Food (Meals Only)</span>
                </div>
                {data.metric_values['food_meal_avg'] && (
                  <ConfidenceBadge
                    confidence={data.metric_values['food_meal_avg'].confidence}
                    sampleSize={data.metric_values['food_meal_avg'].sample_size}
                  />
                )}
              </div>
              <div className="metric-value">
                {formatCurrency(data.food_cost_monthly, currency)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div className="metric-note disclaimer">
                ~{formatCurrency(data.food_meal_avg, currency)}/meal (20 meals/mo)
                <br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  *Sit-down meals only — excludes snacks & drinks
                </span>
              </div>
            </div>

            {/* Transport */}
            <div className="metric-item-box">
              <div className="metric-header">
                <div className="metric-title">
                  <Bus size={15} color="#8b5cf6" />
                  <span>Transport</span>
                </div>
                {data.metric_values['transport_monthly'] && (
                  <ConfidenceBadge
                    confidence={data.metric_values['transport_monthly'].confidence}
                    sampleSize={data.metric_values['transport_monthly'].sample_size}
                  />
                )}
              </div>
              <div className="metric-value">
                {formatCurrency(data.transport_monthly, currency)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div className="metric-note">Transit passes / local daily commute</div>
            </div>

            {/* Groceries */}
            <div className="metric-item-box">
              <div className="metric-header">
                <div className="metric-title">
                  <ShoppingBasket size={15} color="#f59e0b" />
                  <span>Groceries</span>
                </div>
                {data.metric_values['grocery_basket'] && (
                  <ConfidenceBadge
                    confidence={data.metric_values['grocery_basket'].confidence}
                    sampleSize={data.metric_values['grocery_basket'].sample_size}
                  />
                )}
              </div>
              <div className="metric-value">
                {formatCurrency(data.grocery_monthly, currency)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div className="metric-note">Weekly essentials calculated monthly</div>
            </div>
          </div>

          {/* Commute Section (Personalized Mode) */}
          {isPersonalized && data.commute && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-white)',
                  marginBottom: '1rem',
                }}
              >
                <Navigation size={16} color="var(--accent-secondary)" />
                <span>Commute to Workplace ({data.commute.distance_km} km away)</span>
              </div>

              {/* Mode Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {data.commute.available_modes.map((modeDetail: any) => (
                  <button
                    key={modeDetail.mode}
                    type="button"
                    disabled={!modeDetail.is_available}
                    onClick={() => setSelectedCommuteMode(modeDetail.mode)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: modeDetail.is_available ? 'pointer' : 'not-allowed',
                      opacity: modeDetail.is_available ? 1 : 0.45,
                      background:
                        selectedCommuteMode === modeDetail.mode
                          ? 'var(--accent-secondary)'
                          : 'rgba(255, 255, 255, 0.04)',
                      color:
                        selectedCommuteMode === modeDetail.mode ? '#041017' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {getModeIcon(modeDetail.mode)}
                    <span style={{ textTransform: 'capitalize' }}>{modeDetail.mode}</span>
                    {modeDetail.is_available && (
                      <span style={{ opacity: 0.85 }}>({modeDetail.duration_min} min)</span>
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
                  }}
                >
                  {selectedCommuteDetail.is_available ? (
                    <Clock size={14} color="var(--accent-secondary)" />
                  ) : (
                    <AlertTriangle size={14} color="var(--accent-warning)" />
                  )}
                  <span>
                    {selectedCommuteDetail.status_note ||
                      `Est. duration: ${selectedCommuteDetail.duration_min} min`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Verified Facts & Sources Inspector */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                <ShieldCheck size={16} />
                <span>Verified Facts & Supporting Sources ({data.sample_size} observations)</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {showFactsDrawer ? 'Hide Sources ▲' : 'Inspect Sources ▼'}
              </span>
            </div>

            {showFactsDrawer && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                {areaSubmissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {areaSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub.note || 'Observation'}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {formatCurrency(sub.value, currency)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <span>
                            Source: <strong style={{ color: 'var(--text-secondary)' }}>{sub.source_type}</strong> · Observed {sub.observed_at}
                          </span>
                          {sub.evidence_url && (
                            <a
                              href={sub.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-secondary)', textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>View link</span>
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

          {/* Action Bar */}
          <div className="breakdown-actions">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              <CheckCircle2 size={14} color="#10b981" />
              <span>
                Total living cost:{' '}
                <strong>{formatCurrency(data.total_monthly_cost, currency)}/month</strong>
              </span>
            </div>

            <button
              className="fact-submit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSubmitFact(data);
              }}
            >
              <PlusCircle size={14} />
              <span>Submit a fact for {data.area.name}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// src/components/ColdStartView.tsx
// Survive Atlas — Live cold-start progress view with glassmorphic banner & stagger cards

import React from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import type { City, AreaExpenseBreakdown } from '../types/database.types';
import { AreaExpenseCard } from './AreaExpenseCard';
import { AreaCardSkeleton } from './AreaCardSkeleton';

interface ColdStartViewProps {
  city: City;
  readyAreas: AreaExpenseBreakdown[];
  totalAreasCount: number;
  activeAreaName?: string;
  isComplete: boolean;
  isPersonalized?: boolean;
  salary?: number;
  onOpenSubmitFact: (area: AreaExpenseBreakdown) => void;
}

export const ColdStartView: React.FC<ColdStartViewProps> = ({
  city,
  readyAreas,
  totalAreasCount,
  activeAreaName,
  isComplete,
  isPersonalized = false,
  salary,
  onOpenSubmitFact,
}) => {
  // Strict non-zero cost invariant
  const completedAreas = readyAreas.filter((a) => a.total_monthly_cost > 0);
  const pendingCount   = Math.max(0, totalAreasCount - completedAreas.length);
  const progressPct    = totalAreasCount > 0
    ? Math.round((completedAreas.length / totalAreasCount) * 100)
    : 0;
  const isRunning = !isComplete && completedAreas.length < totalAreasCount;

  return (
    <div>
      {/* Progress banner */}
      <div className="glass-panel coldstart-progress-banner">
        <div className="coldstart-progress-header">
          {isRunning ? (
            <>
              <Loader2 size={14} style={{ animation: 'spinRadar 1.2s linear infinite' }} />
              <span>Research Engine · {city.name}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} style={{ color: 'var(--brand-secondary)' }} />
              <span style={{ color: 'var(--brand-secondary)' }}>Research Complete · {city.name}</span>
            </>
          )}
          <div style={{ marginLeft: 'auto', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
            {completedAreas.length} / {totalAreasCount} ready
          </div>
        </div>

        <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {isRunning
            ? `Analyzing student room rents & meal prices in ${city.name}…`
            : `All neighborhoods mapped in ${city.name}`}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          {isRunning
            ? 'Synthesizing room rents, warung meal prices, and transit passes from OpenStreetMap & World Bank open data.'
            : 'Dataset compiled — explore or personalize any neighborhood below.'}
        </p>

        {/* Progress bar */}
        <div className="coldstart-progress-bar-wrap">
          <div
            className="coldstart-progress-fill"
            style={{ width: `${isComplete ? 100 : progressPct}%` }}
          />
        </div>

        {/* Active area indicator */}
        {isRunning && activeAreaName && (
          <div className="coldstart-step-dots">
            <div className="coldstart-step-dot active">
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-secondary)', animation: 'pulseDot 1.4s ease-in-out infinite' }} />
              Computing <strong style={{ color: 'var(--text-primary)' }}>{activeAreaName}</strong> housing &amp; food data…
            </div>
          </div>
        )}
      </div>

      {/* Ready area cards */}
      <div className="areas-results-list stagger-list" style={{ marginTop: '1rem' }}>
        {completedAreas.map((areaData, index) => (
          <div key={areaData.area.id} style={{ position: 'relative' }}>
            {index === 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.3rem 0.85rem',
                background: 'var(--brand-warm-light)', border: '1px solid rgba(249,115,22,0.25)',
                color: 'var(--brand-warm)', fontWeight: 800, fontSize: '0.75rem',
                borderRadius: '10px 10px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em',
                marginBottom: -1,
              }}>
                <Sparkles size={11} />
                {isComplete ? 'Top Best Value' : 'Best Value So Far'}
              </div>
            )}
            <AreaExpenseCard
              data={areaData}
              rank={index + 1}
              isPersonalized={isPersonalized}
              salary={salary}
              onOpenSubmitFact={onOpenSubmitFact}
            />
          </div>
        ))}

        {/* Skeleton placeholders for pending */}
        {pendingCount > 0 &&
          Array.from({ length: pendingCount }).map((_, i) => {
            const isFirstPending = i === 0;
            const skeletonRank   = completedAreas.length + i + 1;
            return (
              <AreaCardSkeleton
                key={`pending-skeleton-${skeletonRank}`}
                rank={skeletonRank}
                activeAreaName={isFirstPending ? activeAreaName : undefined}
                statusText={isFirstPending ? 'In progress' : 'Queued'}
                isResearching={isFirstPending}
              />
            );
          })}
      </div>

      {/* Footer info */}
      {!isComplete && (
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {readyAreas.length} of {totalAreasCount} neighborhoods computed · inspect ready cards while the rest finish.
        </div>
      )}
    </div>
  );
};

export default ColdStartView;

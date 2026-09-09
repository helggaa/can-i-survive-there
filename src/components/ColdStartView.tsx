// src/components/ColdStartView.tsx
// Cyber-fintech progressive cold-start screen with live pipeline radar per UI/UX Pro Max

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
  // Strict non-zero cost invariant: only areas with computed expenses are considered ready
  const completedAreas = readyAreas.filter((a) => a.total_monthly_cost > 0);
  const pendingCount = Math.max(0, totalAreasCount - completedAreas.length);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Progress Radar Banner */}
      <div className="glass-panel coldstart-progress-banner">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {!isComplete && completedAreas.length < totalAreasCount ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spinRadar 1.2s linear infinite' }} />
                  <span>Research Engine Gathering Data · {city.name}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} color="var(--brand-secondary)" />
                  <span>Research Complete for {city.name}</span>
                </>
              )}
            </div>
            <h2 style={{ fontSize: '1.45rem', marginTop: '0.45rem', color: 'var(--text-primary)' }}>
              {!isComplete && completedAreas.length < totalAreasCount
                ? `Analyzing student room rents & meal prices in ${city.name}…`
                : `All neighborhoods mapped in ${city.name}`}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              {!isComplete && completedAreas.length < totalAreasCount
                ? 'Synthesizing student room rents, authentic warung meals, and transit passes from OpenStreetMap & World Bank open data.'
                : 'Dataset compiled. You can explore or personalize any neighborhood below.'}
            </p>
          </div>

          {/* Progress Pill Counter */}
          <div
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-primary-light)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontWeight: 700,
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {completedAreas.length} / {totalAreasCount} ready
          </div>
        </div>

        {/* Active research indicator bar */}
        {!isComplete && activeAreaName && completedAreas.length < totalAreasCount && (
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'var(--brand-secondary)',
                animation: 'pulse-glow 1s ease-in-out infinite',
              }}
            />
            <span>
              Currently computing <strong>{activeAreaName}</strong> housing & food data…
            </span>
          </div>
        )}
      </div>

      {/* Ready Areas List */}
      <div className="area-cards-list">
        {completedAreas.map((areaData, index) => (
          <div key={areaData.area.id} style={{ position: 'relative' }}>
            {index === 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.85rem',
                  background: 'var(--brand-warm-light)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--brand-warm)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '10px 10px 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkles size={12} style={{ color: 'var(--brand-warm)' }} />
                <span>{isComplete ? 'Top Best Value' : 'Best Value So Far'}</span>
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

        {/* High-Fidelity Skeleton Placeholders for Pending Areas */}
        {pendingCount > 0 &&
          Array.from({ length: pendingCount }).map((_, i) => {
            const isFirstPending = i === 0;
            const skeletonRank = completedAreas.length + i + 1;
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

      {/* Footer info notice */}
      {!isComplete && (
        <div
          style={{
            marginTop: '1.75rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            padding: '1rem',
          }}
        >
          <span>
            {readyAreas.length} of {totalAreasCount} neighborhoods computed · you can inspect ready cards immediately while the rest finish.
          </span>
        </div>
      )}
    </div>
  );
};

export default ColdStartView;

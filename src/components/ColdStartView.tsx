// src/components/ColdStartView.tsx
// Cold Start Progressive UI Screen per 03-ux-screens.md (Section 6)

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
    <div className="cold-start-container">
      {/* Progress Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {!isComplete && completedAreas.length < totalAreasCount ? (
                <>
                  <Loader2 size={15} className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span>First-time research in progress for {city.name}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} color="var(--accent-primary)" />
                  <span>Research Complete for {city.name}</span>
                </>
              )}
            </div>
            <h2 style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>
              {!isComplete && completedAreas.length < totalAreasCount
                ? `Building live cost dataset for ${city.name}…`
                : `All neighborhoods ready in ${city.name}`}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {!isComplete && completedAreas.length < totalAreasCount
                ? 'Gathering and cross-checking room rents, sit-down meals, and transport passes in parallel.'
                : 'Dataset enriched with cross-checked figures. You can interact with any area below.'}
            </p>
          </div>

          {/* Real-time Progress Pill */}
          <div
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--accent-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {completedAreas.length} of {totalAreasCount} areas ready
          </div>
        </div>

        {/* Active research indicator */}
        {!isComplete && activeAreaName && completedAreas.length < totalAreasCount && (
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
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
                  padding: '0.25rem 0.75rem',
                  background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                  color: '#041017',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '6px 6px 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Sparkles size={12} />
                <span>{isComplete ? 'Best Match' : 'Best Match So Far'}</span>
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

      {/* Honest Status Footer (03-ux-screens.md Section 6) */}
      {!isComplete && (
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            padding: '1rem',
          }}
        >
          <span>
            {readyAreas.length} of {totalAreasCount} areas ready · usually finishes within a minute or two. You can interact with loaded areas above immediately.
          </span>
        </div>
      )}
    </div>
  );
};

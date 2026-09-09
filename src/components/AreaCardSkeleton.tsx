// src/components/AreaCardSkeleton.tsx
// High-fidelity cyber-glassmorphic loading skeleton matching AreaExpenseCard layout per UI/UX Pro Max

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AreaCardSkeletonProps {
  rank?: number;
  activeAreaName?: string;
  statusText?: string;
  isResearching?: boolean;
}

export const AreaCardSkeleton: React.FC<AreaCardSkeletonProps> = ({
  rank,
  activeAreaName,
  statusText,
  isResearching = false,
}) => {
  return (
    <div
      className="area-card fade-in-card"
      style={{
        border: isResearching
          ? '1px solid var(--border-medium)'
          : '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isResearching ? 'var(--shadow-sm)' : undefined,
      }}
    >
      {/* Active Research Indicator Header */}
      {isResearching && (
        <div
          style={{
            padding: '0.45rem 1.25rem',
            background: 'var(--brand-primary-light)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--brand-primary)',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 size={14} style={{ animation: 'spinRadar 1.2s linear infinite' }} />
            <span>
              {activeAreaName
                ? `Researching ${activeAreaName} rent & meal prices…`
                : 'Estimating neighborhood living costs…'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Referencing OSM &amp; PPP open data
          </span>
        </div>
      )}

      {/* Main Card Summary Skeleton */}
      <div className="area-card-summary" style={{ cursor: 'default' }}>
        {/* Row 1: Area Identity on Left, Total Living Cost on Right */}
        <div className="area-summary-top">
          <div className="area-title-cluster">
            {/* Rank Badge */}
            <div
              className="area-rank-badge"
              style={{
                background: isResearching ? 'var(--brand-primary-light)' : 'var(--bg-surface-alt)',
                color: isResearching ? 'var(--brand-primary)' : 'var(--text-muted)',
              }}
            >
              {rank ? `#${rank}` : <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />}
            </div>

            <div className="area-heading-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {activeAreaName ? (
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    {activeAreaName}
                  </span>
                ) : (
                  <div className="skeleton" style={{ width: 140 + ((rank || 1) % 3) * 30, height: 22 }} />
                )}
                {statusText && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({statusText})
                  </span>
                )}
              </div>
              <div className="skeleton" style={{ width: 120, height: 14, marginTop: 4, borderRadius: 4 }} />
            </div>
          </div>

          {/* Cost & Expand Cluster */}
          <div className="area-cost-cluster">
            <div className="area-cost-amount-block">
              <div className="area-price-sublabel" style={{ marginBottom: 4 }}>Est. Monthly Cost</div>
              <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 6 }} />
            </div>
            <div className="skeleton" style={{ width: 22, height: 22, borderRadius: 4 }} />
          </div>
        </div>

        {/* Row 2: Badges Row Skeleton */}
        <div className="area-badges-row">
          <div className="skeleton" style={{ width: 90, height: 24, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 110, height: 24, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 85, height: 24, borderRadius: 999 }} />
        </div>

        {/* Row 3: Expense Breakdown Bar Skeleton */}
        <div className="expense-breakdown-bar-wrap">
          <div className="skeleton" style={{ width: '100%', height: 7, borderRadius: 999 }} />
          <div className="breakdown-legend-row" style={{ opacity: 0.5 }}>
            <div className="skeleton" style={{ width: 55, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 55, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 65, height: 12, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaCardSkeleton;

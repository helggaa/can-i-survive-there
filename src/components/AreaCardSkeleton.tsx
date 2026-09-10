// src/components/AreaCardSkeleton.tsx
// Survive Atlas — Premium glassmorphic shimmer skeleton matching the new AreaExpenseCard layout

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
      className={`skeleton-card stagger-item ${isResearching ? 'top-pick' : ''}`}
      style={{ boxShadow: isResearching ? 'var(--shadow-md), 0 0 0 1px rgba(59,130,246,0.15)' : 'var(--shadow-xs)' }}
    >
      {/* Researching pulse bar */}
      {isResearching && (
        <div className="skeleton-researching-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 size={14} style={{ animation: 'spinRadar 1.2s linear infinite' }} />
            <span>
              {activeAreaName
                ? `Researching ${activeAreaName} rent & meal prices…`
                : statusText || 'Estimating neighborhood living costs…'}
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>OSM &amp; PPP open data</span>
        </div>
      )}

      {/* Skeleton body */}
      <div className="skeleton-body">
        {/* Top row */}
        <div className="area-summary-top" style={{ cursor: 'default' }}>
          <div className="area-title-cluster">
            {/* Rank badge skeleton */}
            <div
              className="area-rank-badge"
              style={{
                background: isResearching ? 'var(--brand-primary-light)' : 'var(--border-subtle)',
                color: isResearching ? 'var(--brand-primary)' : 'var(--text-muted)',
                border: 'none',
              }}
            >
              {rank ? `#${rank}` : <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />}
            </div>

            <div className="area-heading-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                {activeAreaName ? (
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {activeAreaName}
                  </span>
                ) : (
                  <div className="skeleton" style={{ width: 140 + ((rank || 1) % 3) * 30, height: 20 }} />
                )}
                {statusText && !activeAreaName && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({statusText})</span>
                )}
              </div>
              <div className="skeleton" style={{ width: 110, height: 13 }} />
            </div>
          </div>

          {/* Cost skeleton */}
          <div className="area-cost-cluster">
            <div className="area-cost-amount-block">
              <div className="area-price-sublabel" style={{ marginBottom: 5 }}>Est. Living Cost</div>
              <div className="skeleton" style={{ width: 95, height: 24 }} />
            </div>
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
          </div>
        </div>

        {/* Badges row skeleton */}
        <div className="area-badges-row" style={{ marginTop: '0.85rem' }}>
          <div className="skeleton" style={{ width: 88, height: 22, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 108, height: 22, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 82, height: 22, borderRadius: 999 }} />
        </div>

        {/* Expense bar skeleton */}
        <div className="expense-breakdown-bar-wrap" style={{ marginTop: '0.85rem' }}>
          <div className="skeleton" style={{ width: '100%', height: 6, borderRadius: 999 }} />
          <div className="breakdown-legend-row" style={{ opacity: 0.45 }}>
            <div className="skeleton" style={{ width: 52, height: 11 }} />
            <div className="skeleton" style={{ width: 52, height: 11 }} />
            <div className="skeleton" style={{ width: 62, height: 11 }} />
            <div className="skeleton" style={{ width: 65, height: 11 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaCardSkeleton;

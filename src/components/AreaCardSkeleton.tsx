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
                : 'Synthesizing verified living costs…'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Cross-checking OSM & PPP open data
          </span>
        </div>
      )}

      {/* Main Card Summary Skeleton */}
      <div className="area-card-summary" style={{ cursor: 'default' }}>
        <div className="area-info-main">
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

          {/* Area Title & Location Subtitle */}
          <div className="area-title-group" style={{ width: '100%', maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              {activeAreaName ? (
                <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {activeAreaName}
                </span>
              ) : (
                <div className="skeleton" style={{ width: 150 + ((rank || 1) % 3) * 35, height: 22 }} />
              )}
              {statusText && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({statusText})
                </span>
              )}
            </div>
            {/* Visual Expense Breakdown Bar Skeleton */}
            <div className="skeleton" style={{ width: '100%', maxWidth: 220, height: 6, borderRadius: 999 }} />
          </div>
        </div>

        {/* Cost & Confidence Preview Skeleton */}
        <div className="area-price-group">
          <div>
            <div className="area-price-sublabel" style={{ marginBottom: 4 }}>Est. Monthly Cost</div>
            <div className="skeleton" style={{ width: 110, height: 26, borderRadius: 6 }} />
          </div>

          {/* Confidence Badge Skeleton */}
          <div className="skeleton" style={{ width: 88, height: 26, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
};

export default AreaCardSkeleton;

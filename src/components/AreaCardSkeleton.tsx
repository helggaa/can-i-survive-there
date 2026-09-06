// src/components/AreaCardSkeleton.tsx
// High-fidelity glassmorphic loading skeleton matching AreaExpenseCard layout

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
          ? '1px solid rgba(6, 182, 212, 0.45)'
          : '1px solid var(--border-subtle)',
        background: isResearching
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(6, 182, 212, 0.05))'
          : 'var(--bg-card)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Active Research Indicator Pill if currently computing this area */}
      {isResearching && (
        <div
          style={{
            padding: '0.4rem 1rem',
            background: 'rgba(6, 182, 212, 0.12)',
            borderBottom: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--accent-secondary)',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 size={13} className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
            <span>
              {activeAreaName
                ? `Researching ${activeAreaName} housing & food costs…`
                : 'Researching local room rents and meals…'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cross-checking OSM & crowdsource</span>
        </div>
      )}

      {/* Main Card Summary Skeleton */}
      <div className="area-card-summary" style={{ cursor: 'default' }}>
        <div className="area-info-main">
          {/* Rank Badge */}
          <div
            className="area-rank-badge"
            style={{
              background: isResearching ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: isResearching ? 'var(--accent-secondary)' : 'var(--text-muted)',
            }}
          >
            {rank ? `#${rank}` : <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />}
          </div>

          {/* Area Title & Location Subtitle */}
          <div className="area-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              {activeAreaName ? (
                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-white)' }}>
                  {activeAreaName}
                </span>
              ) : (
                <div className="skeleton" style={{ width: 140 + ((rank || 1) % 3) * 30, height: 20 }} />
              )}
              {statusText && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>
                  ({statusText})
                </span>
              )}
            </div>
            <div className="skeleton" style={{ width: 110, height: 14 }} />
          </div>
        </div>

        {/* Cost & Confidence Preview Skeleton */}
        <div className="area-cost-preview">
          <div className="total-cost-display">
            <div className="cost-label">Est. Living Cost</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <div className="skeleton" style={{ width: 95, height: 22, borderRadius: 4 }} />
            </div>
          </div>

          {/* Confidence Badge Skeleton */}
          <div className="skeleton" style={{ width: 84, height: 24, borderRadius: 12 }} />

          {/* Dummy Chevron */}
          <div style={{ width: 20, height: 20, opacity: 0.2 }}>
            <div className="skeleton" style={{ width: 14, height: 14, borderRadius: '50%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

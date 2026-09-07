// src/components/ConfidenceBadge.tsx
// Displays confidence rating per UI/UX Pro Max specification

import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import type { ConfidenceLevel } from '../types/database.types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  sampleSize?: number;
  showTooltip?: boolean;
  compact?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  sampleSize,
  showTooltip = true,
  compact = false,
}) => {
  const getBadgeDetails = () => {
    switch (confidence) {
      case 'high':
        return {
          label: compact ? 'High' : 'High Confidence',
          icon: <ShieldCheck size={compact ? 11 : 12} strokeWidth={2.5} />,
          bg: 'var(--conf-high-bg)',
          color: 'var(--conf-high-text)',
          border: 'var(--conf-high-border)',
          tooltip: 'Supported by 20+ verified data points & submissions',
        };
      case 'medium':
        return {
          label: compact ? 'Medium' : 'Medium Confidence',
          icon: <ShieldCheck size={compact ? 11 : 12} strokeWidth={2.5} />,
          bg: 'var(--conf-med-bg)',
          color: 'var(--conf-med-text)',
          border: 'var(--conf-med-border)',
          tooltip: 'Supported by 5–19 verified sources/submissions',
        };
      case 'low':
        return {
          label: compact ? 'Low' : 'Low Confidence',
          icon: <ShieldAlert size={compact ? 11 : 12} strokeWidth={2.5} />,
          bg: 'var(--conf-low-bg)',
          color: 'var(--conf-low-text)',
          border: 'var(--conf-low-border)',
          tooltip: '1–4 sources. Useful estimate, but under-sampled',
        };
      case 'estimated':
      default:
        return {
          label: 'Estimated',
          icon: <Sparkles size={compact ? 11 : 12} strokeWidth={2.5} />,
          bg: 'var(--conf-est-bg)',
          color: 'var(--conf-est-text)',
          border: 'var(--conf-est-border)',
          tooltip: 'Baseline model estimate. No crowdsourced points yet',
        };
    }
  };

  const details = getBadgeDetails();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '0.25rem' : '0.35rem',
        padding: compact ? '0.15rem 0.45rem' : '0.22rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        fontSize: compact ? '0.6875rem' : '0.75rem',
        fontWeight: 600,
        background: details.bg,
        color: details.color,
        border: `1px solid ${details.border}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      title={showTooltip ? `${details.tooltip}${sampleSize ? ` (${sampleSize} reports)` : ''}` : undefined}
    >
      {details.icon}
      <span>{details.label}</span>
      {sampleSize !== undefined && sampleSize > 0 && (
        <span style={{ opacity: 0.8, fontSize: compact ? '0.625rem' : '0.6875rem' }}>
          ({sampleSize})
        </span>
      )}
    </span>
  );
};

export default ConfidenceBadge;

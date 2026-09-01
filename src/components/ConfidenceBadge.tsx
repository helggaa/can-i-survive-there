// src/components/ConfidenceBadge.tsx
// Displays confidence rating per 00-overview-prd.md & 02-data-model-schema.md

import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import type { ConfidenceLevel } from '../types/database.types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  sampleSize?: number;
  showTooltip?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  sampleSize,
  showTooltip = true,
}) => {
  const getBadgeDetails = () => {
    switch (confidence) {
      case 'high':
        return {
          label: 'High Confidence',
          icon: <ShieldCheck size={13} />,
          className: 'high',
          tooltip: 'Supported by 20+ verified data points & submissions',
        };
      case 'medium':
        return {
          label: 'Medium Confidence',
          icon: <ShieldCheck size={13} />,
          className: 'medium',
          tooltip: 'Supported by 5–19 verified sources/submissions',
        };
      case 'low':
        return {
          label: 'Low Confidence',
          icon: <ShieldAlert size={13} />,
          className: 'low',
          tooltip: '1–4 sources. Useful estimate, but under-sampled',
        };
      case 'estimated':
      default:
        return {
          label: 'Estimated',
          icon: <Sparkles size={13} />,
          className: 'estimated',
          tooltip: 'Baseline model estimate. No crowdsourced points yet',
        };
    }
  };

  const details = getBadgeDetails();

  return (
    <span
      className={`conf-badge ${details.className}`}
      title={showTooltip ? `${details.tooltip}${sampleSize ? ` (${sampleSize} reports)` : ''}` : undefined}
    >
      {details.icon}
      <span>{details.label}</span>
      {sampleSize !== undefined && sampleSize > 0 && (
        <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({sampleSize})</span>
      )}
    </span>
  );
};

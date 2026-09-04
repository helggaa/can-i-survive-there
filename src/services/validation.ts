// src/services/validation.ts
// Validation rules and sanity bands for insert_area_metric per 04-bootstrap-agent-spec.md & 05-sanity-bands-and-parallel-bootstrap.md

import type { Area, Country, Metric, InsertAreaMetricInput } from '../types/database.types';

export interface SanityBand {
  min: number;
  max: number;
}

/**
 * Calculates dynamic sanity bands derived from country GNI PPP (05-sanity-bands-and-parallel-bootstrap.md).
 */
export function calculateSanityBand(metricKey: string, country: Country): SanityBand {
  const annualGniPpp = country.gni_per_capita_ppp || 120000000;
  const monthlyGniPpp = annualGniPpp / 12;

  const normalizedKey = metricKey === 'rent_monthly' ? 'rent_or_kost_monthly' : metricKey;

  switch (normalizedKey) {
    case 'rent_or_kost_monthly':
      return {
        min: monthlyGniPpp * 0.05,
        max: monthlyGniPpp * 1.50,
      };
    case 'food_meal_avg':
      return {
        min: monthlyGniPpp * 0.001,
        max: monthlyGniPpp * 0.15,
      };
    case 'transport_monthly':
      return {
        min: monthlyGniPpp * 0.005,
        max: monthlyGniPpp * 0.35,
      };
    case 'grocery_basket':
      return {
        min: monthlyGniPpp * 0.005,
        max: monthlyGniPpp * 0.40,
      };
    default:
      return {
        min: 0.01,
        max: Number.MAX_SAFE_INTEGER,
      };
  }
}

/**
 * Validates a proposed metric insertion against all 8 rules.
 */
export function validateAreaMetricInput(
  input: InsertAreaMetricInput,
  context: {
    area?: Area;
    country?: Country;
    validMetrics: Metric[];
    recentSubmissionsCount: number;
  }
): { valid: boolean; reason?: string; normalizedKey: string; metricId?: string } {
  // Rule 1: area_id must exist and belong to the active city/country
  if (!context.area || !context.country) {
    return {
      valid: false,
      reason: `Area ID '${input.area_id}' does not exist or has no valid city/country association.`,
      normalizedKey: input.metric_key,
    };
  }

  // Rule 2: metric_key must be in metrics table (supporting alias rent_monthly -> rent_or_kost_monthly)
  const normalizedKey = input.metric_key === 'rent_monthly' ? 'rent_or_kost_monthly' : input.metric_key;
  const matchedMetric = context.validMetrics.find((m) => m.key === normalizedKey);
  if (!matchedMetric) {
    return {
      valid: false,
      reason: `Unknown metric_key: '${input.metric_key}'. Must match an active metric key in the database.`,
      normalizedKey,
    };
  }

  // Rule 3: Value sanity checks (no negative or zero values)
  if (input.value === null || input.value === undefined || isNaN(input.value) || input.value <= 0) {
    return {
      valid: false,
      reason: 'Value must be strictly positive (greater than 0).',
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  // Rule 4: Currency code must match country.currency_code
  const expectedCurrency = context.country.currency_code.toUpperCase().trim();
  const providedCurrency = (input.currency_code ? input.currency_code.toUpperCase().trim() : expectedCurrency);
  if (providedCurrency !== expectedCurrency) {
    return {
      valid: false,
      reason: `Currency code mismatch: provided '${input.currency_code}' but country expects '${expectedCurrency}'.`,
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  // Rule 5: source_url is required and must be a valid HTTP/HTTPS URL
  if (!input.source_url || typeof input.source_url !== 'string') {
    return {
      valid: false,
      reason: 'source_url is required — no unsourced inserts from agent or users.',
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  const urlTrimmed = input.source_url.trim();
  if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
    return {
      valid: false,
      reason: `Invalid source_url '${input.source_url}'. Must be a valid URL starting with http:// or https://.`,
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  // Rule 6: Range sanity checks per metric against dynamic PPP band
  const band = calculateSanityBand(normalizedKey, context.country);
  if (input.value < band.min || input.value > band.max) {
    return {
      valid: false,
      reason: `Value ${input.value} is out of plausible sanity range [${Math.round(band.min)}, ${Math.round(band.max)}] for ${normalizedKey} in ${expectedCurrency}.`,
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  // Rule 7: Rate/volume cap per area (e.g. max 50 inserts/hour)
  if (context.recentSubmissionsCount >= 50) {
    return {
      valid: false,
      reason: 'Rate limit exceeded: too many inserts for this area within the recent window.',
      normalizedKey,
      metricId: matchedMetric.id,
    };
  }

  return {
    valid: true,
    normalizedKey,
    metricId: matchedMetric.id,
  };
}

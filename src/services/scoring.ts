// src/services/scoring.ts
// Scoring Formula Implementation per 01-scoring-formula.md

import type { AreaExpenseBreakdown, ConfidenceLevel } from '../types/database.types';

export interface ScoringWeights {
  w_cost: number;
  w_commute: number;
  w_confidence: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  w_cost: 0.5,
  w_commute: 0.35,
  w_confidence: 0.15,
};

export const MAX_ACCEPTABLE_COMMUTE_MIN = 90;
export const ASSUMED_MEALS_OUT_PER_MONTH = 20;

/**
 * Returns the numerical confidence weight based on confidence level.
 */
export function getConfidenceWeight(confidence: ConfidenceLevel): number {
  switch (confidence) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.85;
    case 'low':
      return 0.65;
    case 'estimated':
    default:
      return 0.5;
  }
}

/**
 * Calculates commute score for an area given duration in minutes.
 * Clamps at 0 beyond max_acceptable_commute_min (90 min).
 */
export function calculateCommuteScore(durationMin: number, maxCommuteMin: number = MAX_ACCEPTABLE_COMMUTE_MIN): number {
  if (durationMin <= 0) return 1.0;
  if (durationMin >= maxCommuteMin) return 0.0;
  return Math.max(0, Math.min(1, 1 - durationMin / maxCommuteMin));
}

/**
 * Calculates total cost of living breakdown per area per 01-scoring-formula.md.
 */
export function calculateTotalCost(metrics: {
  rent_or_kost_monthly?: number;
  food_meal_avg?: number;
  transport_monthly?: number;
  grocery_basket?: number;
  assumed_meals_out?: number;
}): {
  rent_or_kost_monthly: number;
  food_meal_avg: number;
  food_cost_monthly: number;
  transport_monthly: number;
  grocery_monthly: number;
  total_monthly_cost: number;
} {
  const rent = metrics.rent_or_kost_monthly || 0;
  const mealAvg = metrics.food_meal_avg || 0;
  const mealsCount = metrics.assumed_meals_out ?? ASSUMED_MEALS_OUT_PER_MONTH;
  const foodMonthly = mealAvg * mealsCount;
  const transport = metrics.transport_monthly || 0;
  const groceryWeekly = metrics.grocery_basket || 0;
  const groceryMonthly = groceryWeekly * 4.33;

  const total = rent + foodMonthly + transport + groceryMonthly;

  return {
    rent_or_kost_monthly: Math.round(rent),
    food_meal_avg: Math.round(mealAvg),
    food_cost_monthly: Math.round(foodMonthly),
    transport_monthly: Math.round(transport),
    grocery_monthly: Math.round(groceryMonthly),
    total_monthly_cost: Math.round(total),
  };
}

/**
 * Calculates personalized scoring for an area given user salary, commute duration, and confidence.
 */
export function calculateAreaScore(
  totalCost: number,
  salary: number,
  commuteDurationMin: number,
  confidence: ConfidenceLevel,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  affordability_ratio: number;
  cost_score: number;
  commute_score: number;
  confidence_weight: number;
  final_score: number;
  is_affordable: boolean;
} {
  if (salary <= 0) {
    return {
      affordability_ratio: 1.0,
      cost_score: 0,
      commute_score: 0,
      confidence_weight: getConfidenceWeight(confidence),
      final_score: 0,
      is_affordable: false,
    };
  }

  const affordability_ratio = totalCost / salary;
  const cost_score = Math.max(0, Math.min(1, 1 - affordability_ratio));
  const commute_score = calculateCommuteScore(commuteDurationMin);
  const confidence_weight = getConfidenceWeight(confidence);

  const raw_score =
    weights.w_cost * cost_score +
    weights.w_commute * commute_score +
    weights.w_confidence * confidence_weight;

  // If cost exceeds salary (affordability_ratio >= 1.0), apply a steep affordability penalty
  // so an unaffordable location cannot outrank an affordable one simply due to proximity
  const penalty = affordability_ratio >= 1.0 ? 1 / (1 + (affordability_ratio - 1) * 3) : 1.0;
  const final_score = raw_score * penalty;

  return {
    affordability_ratio: Number(affordability_ratio.toFixed(3)),
    cost_score: Number(cost_score.toFixed(3)),
    commute_score: Number(commute_score.toFixed(3)),
    confidence_weight: Number(confidence_weight.toFixed(3)),
    final_score: Number(final_score.toFixed(3)),
    is_affordable: affordability_ratio < 1.0,
  };
}

/**
 * Sorts areas for Browse Mode: strictly by lowest total_monthly_cost ascending.
 */
export function sortBrowseMode(areas: AreaExpenseBreakdown[]): AreaExpenseBreakdown[] {
  return [...areas].sort((a, b) => a.total_monthly_cost - b.total_monthly_cost);
}

/**
 * Sorts areas for Personalized Mode: strictly by final_score descending.
 */
export function sortPersonalizedMode(areas: AreaExpenseBreakdown[]): AreaExpenseBreakdown[] {
  return [...areas].sort((a, b) => {
    const scoreA = a.score?.final_score ?? 0;
    const scoreB = b.score?.final_score ?? 0;
    return scoreB - scoreA;
  });
}

import type { TransportMode } from "@/types";

/**
 * Multi-objective route/mode optimizer. For a given lane it generates one
 * candidate plan per transport mode, scores each against user-weighted
 * objectives (cost, time, CO₂, reliability), computes the Pareto-optimal
 * frontier, and returns the best plan for the current weighting. Pure &
 * deterministic → unit-testable. This is transparent operations-research, not a
 * black box: every number is derived from the lane and published rate/speed
 * assumptions.
 */

export type ObjectiveKey = "cost" | "time" | "co2" | "reliability";

export interface ObjectiveWeights {
  cost: number;
  time: number;
  co2: number;
  reliability: number;
}

export interface OptimizeInput {
  distanceKm: number;
  weightKg: number;
}

export interface RoutePlan {
  id: string;
  mode: TransportMode;
  label: string;
  costUsd: number;
  transitDays: number;
  co2Kg: number;
  reliability: number; // 0–100 (higher better)
}

export interface ScoredPlan extends RoutePlan {
  score: number; // 0–100, weighted
  onFrontier: boolean;
  breakdown: Record<ObjectiveKey, number>; // per-objective 0–100 (higher better)
}

export interface OptimizeResult {
  plans: ScoredPlan[]; // sorted by score desc
  recommended: ScoredPlan | null;
}

const SPEED_KM_DAY: Record<TransportMode, number> = { truck: 700, rail: 900, ship: 600, plane: 12000 };
const RATE_PER_KM: Record<TransportMode, number> = { truck: 1.8, rail: 0.9, ship: 0.35, plane: 6.0 };
const CO2_FACTOR: Record<TransportMode, number> = { truck: 0.1, rail: 0.03, ship: 0.016, plane: 0.6 };
const BASE_RELIABILITY: Record<TransportMode, number> = { truck: 88, rail: 90, ship: 75, plane: 82 };
const MODE_LABEL: Record<TransportMode, string> = { truck: "Road", rail: "Rail", ship: "Ocean", plane: "Air" };

const MODES: TransportMode[] = ["truck", "rail", "ship", "plane"];

export function generatePlans(input: OptimizeInput): RoutePlan[] {
  const distance = Math.max(0, input.distanceKm);
  const tonnes = Math.max(0, input.weightKg) / 1000;
  const weightFactor = 1 + Math.min(2, input.weightKg / 10000); // heavier → costlier

  return MODES.map((mode) => ({
    id: `plan-${mode}`,
    mode,
    label: MODE_LABEL[mode],
    costUsd: Math.round(distance * RATE_PER_KM[mode] * weightFactor),
    transitDays: Math.round((distance > 0 ? distance / SPEED_KM_DAY[mode] : 0) * 10) / 10,
    co2Kg: Math.round(tonnes * distance * CO2_FACTOR[mode] * 10) / 10,
    reliability: BASE_RELIABILITY[mode],
  }));
}

function normalizeWeights(w: ObjectiveWeights): ObjectiveWeights {
  const total = w.cost + w.time + w.co2 + w.reliability;
  if (total <= 0) return { cost: 0.25, time: 0.25, co2: 0.25, reliability: 0.25 };
  return { cost: w.cost / total, time: w.time / total, co2: w.co2 / total, reliability: w.reliability / total };
}

/** Lower-is-better objective → 0–100 where the cheapest/fastest/greenest = 100. */
function minBetter(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round((1 - (value - min) / (max - min)) * 100);
}

function isDominated(a: RoutePlan, b: RoutePlan): boolean {
  // b dominates a if b is better-or-equal on every objective and strictly better on one.
  const be = b.costUsd <= a.costUsd && b.transitDays <= a.transitDays && b.co2Kg <= a.co2Kg && b.reliability >= a.reliability;
  const strict = b.costUsd < a.costUsd || b.transitDays < a.transitDays || b.co2Kg < a.co2Kg || b.reliability > a.reliability;
  return be && strict;
}

export function optimize(input: OptimizeInput, weights: ObjectiveWeights): OptimizeResult {
  const plans = generatePlans(input);
  if (plans.length === 0) return { plans: [], recommended: null };

  const costs = plans.map((p) => p.costUsd);
  const times = plans.map((p) => p.transitDays);
  const co2s = plans.map((p) => p.co2Kg);
  const minC = Math.min(...costs), maxC = Math.max(...costs);
  const minT = Math.min(...times), maxT = Math.max(...times);
  const minG = Math.min(...co2s), maxG = Math.max(...co2s);

  const w = normalizeWeights(weights);

  const scored: ScoredPlan[] = plans.map((p) => {
    const breakdown: Record<ObjectiveKey, number> = {
      cost: minBetter(p.costUsd, minC, maxC),
      time: minBetter(p.transitDays, minT, maxT),
      co2: minBetter(p.co2Kg, minG, maxG),
      reliability: Math.round(p.reliability),
    };
    const score = Math.round(
      breakdown.cost * w.cost + breakdown.time * w.time + breakdown.co2 * w.co2 + breakdown.reliability * w.reliability,
    );
    const onFrontier = !plans.some((other) => other !== p && isDominated(p, other));
    return { ...p, breakdown, score, onFrontier };
  });

  scored.sort((a, b) => b.score - a.score);
  return { plans: scored, recommended: scored[0] ?? null };
}

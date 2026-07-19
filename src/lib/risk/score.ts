import type { Shipment, Warehouse } from "@/lib/db/types";
import type { RiskLevel, TransportMode, ShipmentStatus } from "@/types";
import { shipmentCost } from "@/lib/domain/calc";

/**
 * Explainable, heuristic shipment-risk engine. Produces a 0–100 risk score with
 * a transparent factor breakdown and a confidence band — no black-box model, no
 * fabricated probabilities. Pure & deterministic (time is passed in), so it is
 * unit-testable and SSR-safe. The scoring interface is intentionally stable so a
 * trained model could later replace the internals without touching callers.
 */

export interface RiskFactor {
  key: string;
  label: string;
  weight: number; // 0–1, factor importance
  score: number; // 0–100, higher = riskier
  detail: string;
}

export interface RiskAssessment {
  shipmentId: string;
  reference: string;
  score: number; // 0–100 composite
  level: RiskLevel;
  confidence: number; // 0–100
  factors: RiskFactor[]; // sorted by contribution desc
  topFactor: string;
  projectedDelayDays: number; // 0 when on track
  valueUsd: number; // exposure, for prioritization
}

const DAY = 86_400_000;

/** Rough cruising throughput (km/day) used to estimate required transit time. */
const SPEED_KM_DAY: Record<TransportMode, number> = {
  truck: 700,
  rail: 900,
  ship: 600,
  plane: 12000,
};

/** Baseline exposure per mode (weather/customs/handling). */
const MODE_EXPOSURE: Record<TransportMode, number> = {
  truck: 32,
  rail: 22,
  ship: 58,
  plane: 46,
};

const STATUS_RISK: Record<ShipmentStatus, number> = {
  pending: 40,
  in_transit: 30,
  at_warehouse: 28,
  customs: 52,
  out_for_delivery: 18,
  delivered: 0,
  delayed: 90,
  exception: 100,
};

function levelFor(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export interface RiskContext {
  /** origin warehouse id → utilization percent (0–100) */
  warehouseUtil: Map<string, number>;
  nowMs: number;
}

export function assessShipmentRisk(s: Shipment, ctx: RiskContext): RiskAssessment {
  const factors: RiskFactor[] = [];

  // 1. Current operational status
  const statusScore = STATUS_RISK[s.status];
  factors.push({
    key: "status",
    label: "Operational status",
    weight: 0.3,
    score: statusScore,
    detail:
      s.status === "exception"
        ? "Flagged with an active exception"
        : s.status === "delayed"
          ? "Already running behind schedule"
          : `Currently ${s.status.replace(/_/g, " ")}`,
  });

  // 2. Schedule pressure — required transit vs remaining time to ETA
  const requiredDays = s.distanceKm > 0 ? s.distanceKm / SPEED_KM_DAY[s.mode] : 0;
  const etaMs = s.eta ? new Date(s.eta).getTime() : NaN;
  const remainingDays = Number.isFinite(etaMs) ? (etaMs - ctx.nowMs) / DAY : NaN;
  let scheduleScore = 35;
  let projectedDelayDays = 0;
  let scheduleDetail = "No ETA set — schedule risk unknown";
  if (Number.isFinite(remainingDays)) {
    const slack = remainingDays - requiredDays;
    if (slack < 0) {
      projectedDelayDays = Math.max(0, Math.round(-slack * 10) / 10);
      scheduleScore = clamp(70 + Math.min(30, -slack * 8));
      scheduleDetail = `~${projectedDelayDays}d short of the ETA at this mode's pace`;
    } else if (slack < 1) {
      scheduleScore = 58;
      scheduleDetail = "Tight — under a day of schedule slack";
    } else {
      scheduleScore = clamp(35 - slack * 4, 8, 40);
      scheduleDetail = `${Math.round(slack)}d of schedule slack`;
    }
  }
  factors.push({ key: "schedule", label: "Schedule pressure", weight: 0.26, score: scheduleScore, detail: scheduleDetail });

  // 3. Mode / route exposure
  factors.push({
    key: "mode",
    label: "Route exposure",
    weight: 0.16,
    score: MODE_EXPOSURE[s.mode],
    detail: `${s.mode} lane baseline weather/customs exposure`,
  });

  // 4. Origin congestion
  const util = ctx.warehouseUtil.get(s.originWarehouseId) ?? null;
  const congestionScore = util === null ? 30 : util >= 95 ? 90 : util >= 90 ? 68 : util >= 80 ? 45 : 20;
  factors.push({
    key: "congestion",
    label: "Origin congestion",
    weight: 0.16,
    score: congestionScore,
    detail: util === null ? "Origin warehouse capacity unknown" : `Origin at ${Math.round(util)}% capacity`,
  });

  // 5. Priority / SLA exposure
  const priorityScore = s.priority === "critical" ? 72 : s.priority === "express" ? 48 : 25;
  factors.push({
    key: "priority",
    label: "SLA exposure",
    weight: 0.12,
    score: priorityScore,
    detail: `${s.priority} priority commitment`,
  });

  const weighted = clamp(factors.reduce((a, f) => a + f.weight * f.score, 0));
  // An active problem should never be graded as merely "medium" because other
  // factors look calm — floor the composite by current status severity.
  const composite =
    s.status === "exception"
      ? Math.max(weighted, 82)
      : s.status === "delayed"
        ? Math.max(weighted, 60)
        : weighted;

  // Confidence from data completeness
  let completeness = 0.5;
  if (Number.isFinite(etaMs)) completeness += 0.2;
  if (s.distanceKm > 0) completeness += 0.15;
  if (util !== null) completeness += 0.15;
  const confidence = Math.round(clamp(completeness * 100));

  const sorted = [...factors].sort((a, b) => b.weight * b.score - a.weight * a.score);

  return {
    shipmentId: s.id,
    reference: s.reference,
    score: Math.round(composite),
    level: levelFor(composite),
    confidence,
    factors: sorted,
    topFactor: sorted[0]!.label,
    projectedDelayDays,
    valueUsd: shipmentCost(s).total,
  };
}

/** Assess all non-delivered shipments, highest risk first. */
export function assessAll(shipments: Shipment[], warehouses: Warehouse[], nowMs: number): RiskAssessment[] {
  const warehouseUtil = new Map<string, number>();
  for (const w of warehouses) {
    warehouseUtil.set(w.id, w.capacityUnits > 0 ? (w.usedUnits / w.capacityUnits) * 100 : 0);
  }
  const ctx: RiskContext = { warehouseUtil, nowMs };
  return shipments
    .filter((s) => s.status !== "delivered")
    .map((s) => assessShipmentRisk(s, ctx))
    .sort((a, b) => b.score - a.score);
}

export interface RiskSummary {
  total: number;
  byLevel: Record<RiskLevel, number>;
  atRisk: number; // high + critical
  valueAtRisk: number; // exposure of high+critical
  avgConfidence: number;
}

export function summarize(assessments: RiskAssessment[]): RiskSummary {
  const byLevel: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  let valueAtRisk = 0;
  let conf = 0;
  for (const a of assessments) {
    byLevel[a.level] += 1;
    if (a.level === "high" || a.level === "critical") valueAtRisk += a.valueUsd;
    conf += a.confidence;
  }
  return {
    total: assessments.length,
    byLevel,
    atRisk: byLevel.high + byLevel.critical,
    valueAtRisk: Math.round(valueAtRisk),
    avgConfidence: assessments.length ? Math.round(conf / assessments.length) : 0,
  };
}

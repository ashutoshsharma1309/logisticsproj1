import type { Shipment, Warehouse, Vehicle } from "@/lib/db/types";
import { shipmentEmissions } from "@/lib/domain/calc";

/**
 * Organization Health Score — a single composite 0–100 signal for the Command
 * Center, derived only from real records. Each sub-metric is computed
 * independently and excluded from the weighted average when there's no data to
 * support it (so a brand-new org isn't unfairly graded on things it hasn't set
 * up). Pure and deterministic → unit-testable.
 */

export interface SubScore {
  key: string;
  label: string;
  value: number | null; // 0–100, or null when not enough data
  weight: number;
  detail: string;
}

export interface HealthResult {
  score: number | null; // null only when the org has literally no data
  grade: "A" | "B" | "C" | "D" | "F" | "—";
  subscores: SubScore[];
}

export interface HealthInput {
  shipments: Shipment[];
  warehouses: Warehouse[];
  vehicles: Vehicle[];
  integrityValid: boolean | null; // ledger chain verification result (null = no ledger)
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function gradeFor(score: number): HealthResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "F";
}

export function computeHealth(input: HealthInput): HealthResult {
  const { shipments, warehouses, vehicles, integrityValid } = input;

  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const disrupted = shipments.filter((s) => s.status === "delayed" || s.status === "exception").length;
  const closed = delivered + disrupted;
  const active = shipments.filter((s) => !["delivered", "exception"].includes(s.status)).length;

  // On-time reliability
  const onTime: SubScore = {
    key: "onTime",
    label: "On-time reliability",
    weight: 0.3,
    value: closed > 0 ? clamp((delivered / closed) * 100) : null,
    detail: closed > 0 ? `${delivered}/${closed} completed on time` : "No completed deliveries yet",
  };

  // Disruption pressure (inverse of active problem share)
  const disruptionShare = active + disrupted > 0 ? disrupted / (active + disrupted) : 0;
  const risk: SubScore = {
    key: "risk",
    label: "Network stability",
    weight: 0.25,
    value: shipments.length > 0 ? clamp(100 - disruptionShare * 100) : null,
    detail: shipments.length > 0 ? `${disrupted} shipment(s) disrupted` : "No shipments yet",
  };

  // Warehouse utilization — rewards a healthy band, penalizes overload
  const totalCap = warehouses.reduce((a, w) => a + w.capacityUnits, 0);
  const usedCap = warehouses.reduce((a, w) => a + w.usedUnits, 0);
  const util = totalCap > 0 ? (usedCap / totalCap) * 100 : 0;
  const utilScore = util <= 85 ? (util / 85) * 100 : 100 - (util - 85) * 4;
  const utilization: SubScore = {
    key: "utilization",
    label: "Warehouse utilization",
    weight: 0.2,
    value: warehouses.length > 0 ? clamp(utilScore) : null,
    detail: warehouses.length > 0 ? `${Math.round(util)}% of capacity in use` : "No warehouses yet",
  };

  // Fleet readiness — share of vehicles active and not in maintenance
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const fleet: SubScore = {
    key: "fleet",
    label: "Fleet readiness",
    weight: 0.15,
    value: vehicles.length > 0 ? clamp((activeVehicles / vehicles.length) * 100) : null,
    detail: vehicles.length > 0 ? `${activeVehicles}/${vehicles.length} vehicles active` : "No vehicles yet",
  };

  // Ledger integrity
  const integrity: SubScore = {
    key: "integrity",
    label: "Ledger integrity",
    weight: 0.1,
    value: integrityValid === null ? null : integrityValid ? 100 : 40,
    detail:
      integrityValid === null
        ? "No ledger blocks yet"
        : integrityValid
          ? "Chain verified"
          : "Chain integrity broken",
  };

  const subscores = [onTime, risk, utilization, fleet, integrity];
  const active_ss = subscores.filter((s) => s.value !== null);

  if (active_ss.length === 0) {
    return { score: null, grade: "—", subscores };
  }

  const totalWeight = active_ss.reduce((a, s) => a + s.weight, 0);
  const weighted = active_ss.reduce((a, s) => a + (s.value as number) * s.weight, 0) / totalWeight;
  const score = clamp(weighted);

  return { score, grade: gradeFor(score), subscores };
}

/** Total network CO₂ (kg) — surfaced alongside health in the Command Center. */
export function totalEmissions(shipments: Shipment[]): number {
  return Math.round(shipments.reduce((a, s) => a + shipmentEmissions(s), 0));
}

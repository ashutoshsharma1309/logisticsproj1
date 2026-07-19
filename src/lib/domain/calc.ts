import type { Shipment } from "@/lib/db/types";
import type { TransportMode } from "@/types";

export interface CostBreakdown {
  freight: number;
  fuel: number;
  packaging: number;
  insurance: number;
  other: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function shipmentCost(s: Pick<
  Shipment,
  "freightCharge" | "fuelCost" | "packagingCost" | "insuranceCost" | "otherCost" | "taxRatePct"
>): CostBreakdown {
  const freight = num(s.freightCharge);
  const fuel = num(s.fuelCost);
  const packaging = num(s.packagingCost);
  const insurance = num(s.insuranceCost);
  const other = num(s.otherCost);
  const subtotal = freight + fuel + packaging + insurance + other;
  const tax = Math.round(subtotal * (num(s.taxRatePct) / 100) * 100) / 100;
  return { freight, fuel, packaging, insurance, other, subtotal, tax, total: subtotal + tax };
}

const CO2_FACTOR: Record<TransportMode, number> = {
  truck: 0.1,
  rail: 0.03,
  ship: 0.016,
  plane: 0.6,
};

/** Estimated CO₂ (kg) from user-entered weight, distance and mode. */
export function shipmentEmissions(s: Pick<Shipment, "weightKg" | "distanceKm" | "mode">): number {
  const tonnes = num(s.weightKg) / 1000;
  return Math.round(tonnes * num(s.distanceKm) * (CO2_FACTOR[s.mode] ?? 0.1) * 10) / 10;
}

export function nextReference(existingCount: number): string {
  return `CR-${String(100001 + existingCount)}`;
}

function num(v: number | undefined | null): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

import { describe, it, expect } from "vitest";
import {
  shipmentCost,
  shipmentEmissions,
  nextReference,
} from "@/lib/domain/calc";

describe("shipmentCost", () => {
  it("sums the components into a subtotal and applies tax", () => {
    const c = shipmentCost({
      freightCharge: 1000,
      fuelCost: 200,
      packagingCost: 50,
      insuranceCost: 100,
      otherCost: 150,
      taxRatePct: 18,
    });
    expect(c.subtotal).toBe(1500);
    expect(c.tax).toBe(270); // 1500 * 18%
    expect(c.total).toBe(1770);
  });

  it("rounds tax to 2 decimals", () => {
    const c = shipmentCost({
      freightCharge: 99.99,
      fuelCost: 0,
      packagingCost: 0,
      insuranceCost: 0,
      otherCost: 0,
      taxRatePct: 12,
    });
    // 99.99 * 0.12 = 11.9988 -> 12.0 (rounded to 2dp)
    expect(c.tax).toBe(12);
    expect(c.total).toBe(111.99);
  });

  it("treats missing / NaN values as 0 (never persists NaN)", () => {
    const c = shipmentCost({
      freightCharge: Number.NaN,
      fuelCost: undefined as unknown as number,
      packagingCost: null as unknown as number,
      insuranceCost: 500,
      otherCost: 0,
      taxRatePct: Number.NaN,
    });
    expect(c.subtotal).toBe(500);
    expect(c.tax).toBe(0);
    expect(c.total).toBe(500);
    expect(Number.isNaN(c.total)).toBe(false);
  });

  it("handles a zero-cost shipment", () => {
    const c = shipmentCost({
      freightCharge: 0,
      fuelCost: 0,
      packagingCost: 0,
      insuranceCost: 0,
      otherCost: 0,
      taxRatePct: 0,
    });
    expect(c).toMatchObject({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe("shipmentEmissions", () => {
  it("computes tonnes x distance x mode factor", () => {
    // 2000kg = 2t, 1000km, truck factor 0.1 -> 200 kg
    expect(shipmentEmissions({ weightKg: 2000, distanceKm: 1000, mode: "truck" })).toBe(200);
  });

  it("uses the correct factor per mode (plane > truck > rail > ship)", () => {
    const base = { weightKg: 1000, distanceKm: 1000 } as const;
    const plane = shipmentEmissions({ ...base, mode: "plane" });
    const truck = shipmentEmissions({ ...base, mode: "truck" });
    const rail = shipmentEmissions({ ...base, mode: "rail" });
    const ship = shipmentEmissions({ ...base, mode: "ship" });
    expect(plane).toBe(600);
    expect(truck).toBe(100);
    expect(rail).toBe(30);
    expect(ship).toBe(16);
    expect(plane).toBeGreaterThan(truck);
    expect(truck).toBeGreaterThan(rail);
    expect(rail).toBeGreaterThan(ship);
  });

  it("returns 0 for zero weight or distance", () => {
    expect(shipmentEmissions({ weightKg: 0, distanceKm: 1000, mode: "truck" })).toBe(0);
    expect(shipmentEmissions({ weightKg: 1000, distanceKm: 0, mode: "truck" })).toBe(0);
  });
});

describe("nextReference", () => {
  it("generates sequential, prefixed references", () => {
    expect(nextReference(0)).toBe("CR-100001");
    expect(nextReference(1)).toBe("CR-100002");
    expect(nextReference(41)).toBe("CR-100042");
  });
});

import { describe, it, expect } from "vitest";
import { computeHealth, totalEmissions, type HealthInput } from "@/lib/health/score";
import type { Shipment, Warehouse, Vehicle } from "@/lib/db/types";

function ship(o: Partial<Shipment>): Shipment {
  return {
    id: "s", orgId: "o", reference: "CR-1", customerId: "c", originWarehouseId: "w",
    destinationCity: "X", destinationState: "", destinationCountry: "",
    mode: "truck", status: "pending", priority: "standard",
    weightKg: 1000, distanceKm: 1000, packages: 1,
    freightCharge: 0, fuelCost: 0, packagingCost: 0, insuranceCost: 0, otherCost: 0,
    taxRatePct: 0, driverId: null, vehicleId: null, eta: "", notes: "",
    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...o,
  };
}
function wh(o: Partial<Warehouse>): Warehouse {
  return {
    id: "w", orgId: "o", name: "W", code: "W", addressLine1: "", city: "", state: "",
    country: "", capacityUnits: 1000, usedUnits: 500, serviceAreas: [], contactName: "",
    contactPhone: "", createdAt: "2026-01-01T00:00:00Z", ...o,
  };
}
function veh(o: Partial<Vehicle>): Vehicle {
  return {
    id: "v", orgId: "o", plate: "P", makeModel: "M", type: "van", fuelType: "diesel",
    capacityKg: 1000, odometerKm: 0, status: "active", driverId: null, purchaseCost: 0,
    monthlyMaintenanceCost: 0, fuelCostPerKm: 0, createdAt: "2026-01-01T00:00:00Z", ...o,
  };
}

const empty: HealthInput = { shipments: [], warehouses: [], vehicles: [], integrityValid: null };

describe("computeHealth", () => {
  it("returns a null score + '—' grade for a brand-new empty org", () => {
    const r = computeHealth(empty);
    expect(r.score).toBeNull();
    expect(r.grade).toBe("—");
    expect(r.subscores).toHaveLength(5);
    expect(r.subscores.every((s) => s.value === null)).toBe(true);
  });

  it("excludes sub-metrics with no supporting data from the weighted average", () => {
    // Only warehouses present → only utilization contributes.
    const r = computeHealth({ ...empty, warehouses: [wh({ capacityUnits: 1000, usedUnits: 850 })] });
    const active = r.subscores.filter((s) => s.value !== null);
    expect(active.map((s) => s.key)).toEqual(["utilization"]);
    expect(r.score).toBe(active[0]!.value);
  });

  it("penalizes warehouse overload beyond the healthy band", () => {
    const healthy = computeHealth({ ...empty, warehouses: [wh({ capacityUnits: 100, usedUnits: 80 })] });
    const overloaded = computeHealth({ ...empty, warehouses: [wh({ capacityUnits: 100, usedUnits: 100 })] });
    expect(overloaded.score!).toBeLessThan(healthy.score!);
  });

  it("rewards on-time completion and penalizes disruption", () => {
    const good = computeHealth({
      ...empty,
      shipments: [ship({ status: "delivered" }), ship({ status: "delivered" }), ship({ status: "delivered" })],
    });
    const bad = computeHealth({
      ...empty,
      shipments: [ship({ status: "delivered" }), ship({ status: "exception" }), ship({ status: "delayed" })],
    });
    expect(good.score!).toBeGreaterThan(bad.score!);
    expect(good.grade).toBe("A");
  });

  it("drops ledger integrity sharply when the chain is broken", () => {
    const base = { ...empty, shipments: [ship({ status: "delivered" })] };
    const ok = computeHealth({ ...base, integrityValid: true });
    const broken = computeHealth({ ...base, integrityValid: false });
    expect(broken.score!).toBeLessThan(ok.score!);
  });

  it("assigns letter grades on the expected bands", () => {
    const a = computeHealth({ ...empty, shipments: [ship({ status: "delivered" })], integrityValid: true });
    expect(["A", "B"]).toContain(a.grade);
  });
});

describe("totalEmissions", () => {
  it("sums per-shipment estimated CO₂", () => {
    // 2t * 1000km * 0.1 = 200
    expect(totalEmissions([ship({ weightKg: 2000, distanceKm: 1000, mode: "truck" })])).toBe(200);
  });
  it("is 0 for no shipments", () => {
    expect(totalEmissions([])).toBe(0);
  });
});

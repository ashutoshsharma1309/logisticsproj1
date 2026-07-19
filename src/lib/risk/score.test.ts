import { describe, it, expect } from "vitest";
import { assessShipmentRisk, assessAll, summarize, type RiskContext } from "@/lib/risk/score";
import type { Shipment, Warehouse } from "@/lib/db/types";

const NOW = new Date("2026-07-05T00:00:00Z").getTime();
const DAY = 86_400_000;

function ship(o: Partial<Shipment>): Shipment {
  return {
    id: "s", orgId: "o", reference: "CR-1", customerId: "c", originWarehouseId: "w",
    destinationCity: "X", destinationState: "", destinationCountry: "",
    mode: "truck", status: "in_transit", priority: "standard",
    weightKg: 1000, distanceKm: 700, packages: 1,
    freightCharge: 1000, fuelCost: 0, packagingCost: 0, insuranceCost: 0, otherCost: 0,
    taxRatePct: 0, driverId: null, vehicleId: null,
    eta: new Date(NOW + 5 * DAY).toISOString(), notes: "",
    createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-07-01T00:00:00Z", ...o,
  };
}
const ctx: RiskContext = { warehouseUtil: new Map([["w", 50]]), nowMs: NOW };

describe("assessShipmentRisk", () => {
  it("scores an exception shipment as critical", () => {
    const r = assessShipmentRisk(ship({ status: "exception" }), ctx);
    expect(r.level).toBe("critical");
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.topFactor).toBeTruthy();
    expect(r.factors).toHaveLength(5);
  });

  it("scores a comfortably-scheduled shipment lower than a behind-schedule one", () => {
    const slack = assessShipmentRisk(ship({ eta: new Date(NOW + 10 * DAY).toISOString() }), ctx);
    const behind = assessShipmentRisk(ship({ eta: new Date(NOW - 2 * DAY).toISOString() }), ctx);
    expect(behind.score).toBeGreaterThan(slack.score);
    expect(behind.projectedDelayDays).toBeGreaterThan(0);
    expect(slack.projectedDelayDays).toBe(0);
  });

  it("raises risk when the origin warehouse is congested", () => {
    const calm = assessShipmentRisk(ship({}), { warehouseUtil: new Map([["w", 40]]), nowMs: NOW });
    const jammed = assessShipmentRisk(ship({}), { warehouseUtil: new Map([["w", 96]]), nowMs: NOW });
    expect(jammed.score).toBeGreaterThan(calm.score);
    expect(jammed.factors.find((f) => f.key === "congestion")!.score).toBeGreaterThan(
      calm.factors.find((f) => f.key === "congestion")!.score,
    );
  });

  it("reports lower confidence when data is incomplete", () => {
    const full = assessShipmentRisk(ship({}), ctx);
    const sparse = assessShipmentRisk(ship({ eta: "", distanceKm: 0 }), { warehouseUtil: new Map(), nowMs: NOW });
    expect(full.confidence).toBeGreaterThan(sparse.confidence);
  });

  it("orders factors by contribution (highest first)", () => {
    const r = assessShipmentRisk(ship({ status: "exception" }), ctx);
    const contrib = r.factors.map((f) => f.weight * f.score);
    for (let i = 1; i < contrib.length; i++) expect(contrib[i - 1]!).toBeGreaterThanOrEqual(contrib[i]!);
  });
});

describe("assessAll", () => {
  const warehouses: Warehouse[] = [
    { id: "w", orgId: "o", name: "W", code: "W", addressLine1: "", city: "", state: "", country: "", capacityUnits: 1000, usedUnits: 950, serviceAreas: [], contactName: "", contactPhone: "", createdAt: "2026-01-01T00:00:00Z" },
  ];
  it("excludes delivered shipments and sorts by risk desc", () => {
    const list = assessAll(
      [ship({ id: "a", status: "delivered" }), ship({ id: "b", status: "in_transit" }), ship({ id: "c", status: "exception" })],
      warehouses,
      NOW,
    );
    expect(list.map((r) => r.shipmentId)).toEqual(["c", "b"]);
    expect(list[0]!.score).toBeGreaterThanOrEqual(list[1]!.score);
  });
});

describe("summarize", () => {
  it("counts levels and computes value-at-risk", () => {
    const list = assessAll([ship({ id: "c", status: "exception", freightCharge: 5000 })], [], NOW);
    const s = summarize(list);
    expect(s.total).toBe(1);
    expect(s.byLevel.critical).toBe(1);
    expect(s.atRisk).toBe(1);
    expect(s.valueAtRisk).toBe(5000);
  });
});

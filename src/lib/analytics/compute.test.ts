import { describe, it, expect } from "vitest";
import {
  computeStats,
  computeRevenue,
  revenueTrend,
  deliveryTrend,
  modeSplit,
  statusSplit,
  costBreakdown,
  fleetStatusSplit,
  warehouseUtilization,
  type DataBundle,
} from "@/lib/analytics/compute";
import type { Shipment, Warehouse, Vehicle } from "@/lib/db/types";

function mkShipment(o: Partial<Shipment>): Shipment {
  return {
    id: "s", orgId: "o", reference: "CR-1", customerId: "c", originWarehouseId: "w",
    destinationCity: "Denver", destinationState: "", destinationCountry: "USA",
    mode: "truck", status: "pending", priority: "standard",
    weightKg: 1000, distanceKm: 1000, packages: 1,
    freightCharge: 1000, fuelCost: 0, packagingCost: 0, insuranceCost: 0, otherCost: 0,
    taxRatePct: 0, driverId: null, vehicleId: null, eta: "", notes: "",
    createdAt: "2026-03-10T00:00:00.000Z", updatedAt: "2026-03-10T00:00:00.000Z",
    ...o,
  };
}
function mkWarehouse(o: Partial<Warehouse>): Warehouse {
  return {
    id: "w", orgId: "o", name: "WH", code: "W1", addressLine1: "", city: "", state: "",
    country: "", capacityUnits: 1000, usedUnits: 500, serviceAreas: [], contactName: "",
    contactPhone: "", createdAt: "2026-01-01T00:00:00.000Z", ...o,
  };
}
function mkVehicle(o: Partial<Vehicle>): Vehicle {
  return {
    id: "v", orgId: "o", plate: "P", makeModel: "M", type: "van", fuelType: "diesel",
    capacityKg: 1000, odometerKm: 0, status: "active", driverId: null, purchaseCost: 0,
    monthlyMaintenanceCost: 0, fuelCostPerKm: 0, createdAt: "2026-01-01T00:00:00.000Z", ...o,
  };
}

const EMPTY: DataBundle = { shipments: [], warehouses: [], vehicles: [], drivers: [], customers: [], invoices: [] };

describe("computeStats — empty workspace", () => {
  const stats = computeStats(EMPTY, "USD");

  it("returns all nine stat tiles", () => {
    expect(stats).toHaveLength(9);
  });
  it("marks every stat empty and shows an em-dash (no fabricated numbers)", () => {
    for (const s of stats) {
      expect(s.empty).toBe(true);
      expect(s.display).toBe("—");
    }
  });
});

describe("computeStats — populated workspace", () => {
  const bundle: DataBundle = {
    ...EMPTY,
    shipments: [
      mkShipment({ status: "delivered", freightCharge: 1000, taxRatePct: 10 }), // total 1100
      mkShipment({ status: "delayed", freightCharge: 500, taxRatePct: 0 }),      // total 500
      mkShipment({ status: "in_transit" }),                                      // active
    ],
    warehouses: [mkWarehouse({ capacityUnits: 1000, usedUnits: 750 })],
    vehicles: [mkVehicle({ status: "active" }), mkVehicle({ status: "maintenance" })],
  };
  const stats = computeStats(bundle, "USD");
  const byId = (id: string) => stats.find((s) => s.id === id)!;

  it("computes total shipment value from real cost breakdowns", () => {
    expect(byId("revenue").value).toBe(2600); // 1100 + 500 + 1000
    expect(byId("revenue").empty).toBe(false);
  });
  it("counts active (not delivered/exception) shipments", () => {
    // delivered excluded, delayed + in_transit remain active
    expect(byId("active").value).toBe(2);
  });
  it("counts delivered and delayed", () => {
    expect(byId("delivered").value).toBe(1);
    expect(byId("delayed").value).toBe(1);
  });
  it("computes warehouse utilization percentage", () => {
    expect(byId("warehouse").display).toBe("75%");
  });
  it("reports fleet count with active hint", () => {
    expect(byId("fleet").value).toBe(2);
    expect(byId("fleet").hint).toContain("1 active");
  });
});

describe("computeRevenue", () => {
  it("sums shipment totals", () => {
    expect(computeRevenue([mkShipment({ freightCharge: 100, taxRatePct: 0 })])).toBe(100);
  });
  it("is 0 for no shipments", () => {
    expect(computeRevenue([])).toBe(0);
  });
});

describe("time-series derivations are empty-safe", () => {
  it("all return [] with no data (empty states instead of fake charts)", () => {
    expect(revenueTrend([])).toEqual([]);
    expect(deliveryTrend([])).toEqual([]);
    expect(modeSplit([])).toEqual([]);
    expect(statusSplit([])).toEqual([]);
    expect(costBreakdown([])).toEqual([]);
    expect(fleetStatusSplit([])).toEqual([]);
    expect(warehouseUtilization([])).toEqual([]);
  });
});

describe("modeSplit", () => {
  it("counts by mode and omits empty modes", () => {
    const r = modeSplit([mkShipment({ mode: "truck" }), mkShipment({ mode: "truck" }), mkShipment({ mode: "ship" })]);
    expect(r).toEqual([
      { label: "Truck", value: 2 },
      { label: "Ship", value: 1 },
    ]);
  });
});

describe("statusSplit", () => {
  it("humanizes status labels and counts them", () => {
    const r = statusSplit([mkShipment({ status: "in_transit" }), mkShipment({ status: "in_transit" })]);
    expect(r).toEqual([{ label: "In Transit", value: 2 }]);
  });
});

describe("costBreakdown", () => {
  it("aggregates cost components and drops zero buckets", () => {
    const r = costBreakdown([
      mkShipment({ freightCharge: 1000, fuelCost: 200, taxRatePct: 10 }),
    ]);
    const labels = r.map((d) => d.label);
    expect(labels).toContain("Freight");
    expect(labels).toContain("Fuel");
    expect(labels).toContain("Tax");
    expect(labels).not.toContain("Packaging"); // zero -> dropped
    expect(r.find((d) => d.label === "Freight")!.value).toBe(1000);
  });
});

describe("revenueTrend", () => {
  it("groups by month in calendar order", () => {
    const r = revenueTrend([
      mkShipment({ createdAt: "2026-02-01T00:00:00.000Z", freightCharge: 100, taxRatePct: 0 }),
      mkShipment({ createdAt: "2026-01-01T00:00:00.000Z", freightCharge: 200, taxRatePct: 0 }),
    ]);
    expect(r.map((d) => d.label)).toEqual(["Jan", "Feb"]); // ordered, not insertion order
  });
});

describe("warehouseUtilization", () => {
  it("computes per-warehouse pct and guards divide-by-zero", () => {
    const r = warehouseUtilization([
      mkWarehouse({ name: "A", capacityUnits: 1000, usedUnits: 250 }),
      mkWarehouse({ name: "B", capacityUnits: 0, usedUnits: 0 }),
    ]);
    expect(r[0]).toMatchObject({ name: "A", pct: 25 });
    expect(r[1]!.pct).toBe(0);
  });
});

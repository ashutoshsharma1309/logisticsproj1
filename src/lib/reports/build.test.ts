import { describe, it, expect } from "vitest";
import { buildReport, reportRange, type ReportInput } from "@/lib/reports/build";
import type { Shipment, Warehouse, Vehicle, Customer } from "@/lib/db/types";

const NOW = new Date("2026-07-05T00:00:00Z").getTime();
const DAY = 86_400_000;

function ship(o: Partial<Shipment>): Shipment {
  return {
    id: "s", orgId: "o", reference: "CR-1", customerId: "c1", originWarehouseId: "w1",
    destinationCity: "Denver", destinationState: "", destinationCountry: "",
    mode: "truck", status: "delivered", priority: "standard",
    weightKg: 1000, distanceKm: 500, packages: 1,
    freightCharge: 1000, fuelCost: 0, packagingCost: 0, insuranceCost: 0, otherCost: 0,
    taxRatePct: 0, driverId: null, vehicleId: null, eta: "", notes: "",
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
    updatedAt: new Date(NOW - 1 * DAY).toISOString(),
    ...o,
  };
}
function wh(o: Partial<Warehouse>): Warehouse {
  return {
    id: "w1", orgId: "o", name: "Main Hub", code: "W1", addressLine1: "", city: "", state: "",
    country: "", capacityUnits: 1000, usedUnits: 500, serviceAreas: [], contactName: "",
    contactPhone: "", createdAt: "2026-01-01T00:00:00Z", ...o,
  };
}
function veh(o: Partial<Vehicle>): Vehicle {
  return {
    id: "v1", orgId: "o", plate: "P", makeModel: "M", type: "van", fuelType: "diesel",
    capacityKg: 1000, odometerKm: 0, status: "active", driverId: null, purchaseCost: 0,
    monthlyMaintenanceCost: 0, fuelCostPerKm: 0, createdAt: "2026-01-01T00:00:00Z", ...o,
  };
}
function cust(o: Partial<Customer>): Customer {
  return {
    id: "c1", orgId: "o", name: "N", company: "Acme Co", email: "", phone: "", gstin: "",
    addressLine1: "", city: "", state: "", country: "", createdAt: "2026-01-01T00:00:00Z", ...o,
  };
}

const empty: ReportInput = { shipments: [], warehouses: [], vehicles: [], customers: [], invoices: [] };

describe("reportRange", () => {
  it("computes daily/weekly/monthly windows ending at the given time", () => {
    const d = reportRange("daily", NOW);
    const w = reportRange("weekly", NOW);
    const m = reportRange("monthly", NOW);
    expect(d.end).toBe(NOW);
    expect(NOW - d.start).toBe(DAY);
    expect(NOW - w.start).toBe(7 * DAY);
    expect(NOW - m.start).toBe(30 * DAY);
  });
});

describe("buildReport — empty workspace", () => {
  it("never throws and returns all-zero sections", () => {
    const r = buildReport(empty, "weekly", NOW);
    expect(r.summary.shipmentCount).toBe(0);
    expect(r.summary.revenue).toBe(0);
    expect(r.cost.topLanes).toEqual([]);
    expect(r.utilization.warehouses).toEqual([]);
    expect(r.customers.topCustomers).toEqual([]);
    expect(r.bottlenecks).toEqual([]);
  });
});

describe("buildReport — executive summary", () => {
  it("only counts shipments inside the period window", () => {
    const input: ReportInput = {
      ...empty,
      shipments: [
        ship({ id: "in", createdAt: new Date(NOW - 2 * DAY).toISOString() }),
        ship({ id: "out", createdAt: new Date(NOW - 20 * DAY).toISOString() }),
      ],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.summary.shipmentCount).toBe(1);
  });

  it("computes on-time rate from delivered vs delayed", () => {
    const input: ReportInput = {
      ...empty,
      shipments: [
        ship({ id: "a", status: "delivered" }),
        ship({ id: "b", status: "delivered" }),
        ship({ id: "c", status: "delayed" }),
      ],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.summary.onTimeRate).toBe(67); // 2/3 rounded
  });
});

describe("buildReport — cost insight", () => {
  it("ranks lanes by total cost, highest first", () => {
    const input: ReportInput = {
      ...empty,
      warehouses: [wh({ id: "w1", name: "Rotterdam" })],
      shipments: [
        ship({ id: "a", originWarehouseId: "w1", destinationCity: "Denver", freightCharge: 5000 }),
        ship({ id: "b", originWarehouseId: "w1", destinationCity: "Austin", freightCharge: 100 }),
      ],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.cost.topLanes[0]!.lane).toBe("Rotterdam → Denver");
    expect(r.cost.topLanes[0]!.totalCost).toBeGreaterThan(r.cost.topLanes[1]!.totalCost);
  });
});

describe("buildReport — utilization insight", () => {
  it("computes average warehouse utilization and fleet active %", () => {
    const input: ReportInput = {
      ...empty,
      warehouses: [wh({ capacityUnits: 1000, usedUnits: 800 })],
      vehicles: [veh({ status: "active" }), veh({ id: "v2", status: "maintenance" })],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.utilization.avgWarehouseUtil).toBe(80);
    expect(r.utilization.activeVehiclePct).toBe(50);
    expect(r.utilization.vehiclesInMaintenance).toBe(1);
  });
});

describe("buildReport — customer insight", () => {
  it("ranks customers by spend and counts new customers in the period", () => {
    const input: ReportInput = {
      ...empty,
      customers: [cust({ id: "c1", company: "Acme" }), cust({ id: "c2", company: "Globex", createdAt: new Date(NOW - 2 * DAY).toISOString() })],
      shipments: [ship({ id: "a", customerId: "c1", freightCharge: 900 })],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.customers.topCustomers[0]!.name).toBe("Acme");
    expect(r.customers.newCustomers).toBe(1);
  });
});

describe("buildReport — bottleneck detection", () => {
  it("flags a near-full warehouse", () => {
    const input: ReportInput = { ...empty, warehouses: [wh({ capacityUnits: 1000, usedUnits: 960 })] };
    const r = buildReport(input, "weekly", NOW);
    expect(r.bottlenecks.some((b) => b.id.startsWith("wh-"))).toBe(true);
  });

  it("flags a spike in exceptions", () => {
    const input: ReportInput = {
      ...empty,
      shipments: Array.from({ length: 3 }, (_, i) => ship({ id: `e${i}`, status: "exception" })),
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.bottlenecks.some((b) => b.id === "exceptions")).toBe(true);
  });

  it("stays quiet when nothing is wrong", () => {
    const input: ReportInput = {
      ...empty,
      warehouses: [wh({ capacityUnits: 1000, usedUnits: 400 })],
      vehicles: [veh({ status: "active" })],
      shipments: [ship({ status: "delivered" })],
    };
    const r = buildReport(input, "weekly", NOW);
    expect(r.bottlenecks).toEqual([]);
  });
});

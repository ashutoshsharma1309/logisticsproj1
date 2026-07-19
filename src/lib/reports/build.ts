import type { Shipment, Warehouse, Vehicle, Customer, Invoice } from "@/lib/db/types";
import { shipmentCost, shipmentEmissions } from "@/lib/domain/calc";
import { computeRevenue, warehouseUtilization } from "@/lib/analytics/compute";

/**
 * Business-intelligence report builder. Auto-generates a daily/weekly/monthly
 * operations report from the org's real records — no fabricated numbers, no
 * LLM narrative (that's a documented future upgrade; the section shape here is
 * stable so a narrative layer could summarize it later). Pure & deterministic:
 * the period boundary is passed in, never computed from `Date.now()` inside.
 */

export type ReportPeriod = "daily" | "weekly" | "monthly";

const PERIOD_MS: Record<ReportPeriod, number> = {
  daily: 86_400_000,
  weekly: 7 * 86_400_000,
  monthly: 30 * 86_400_000,
};

export interface ReportRange {
  start: number;
  end: number;
  label: string;
}

export function reportRange(period: ReportPeriod, endMs: number): ReportRange {
  const end = endMs;
  const start = end - PERIOD_MS[period];
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` };
}

function inRange(iso: string, range: ReportRange): boolean {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= range.start && t <= range.end;
}

// ---- Section: Executive summary --------------------------------------------
export interface ExecutiveSummary {
  shipmentCount: number;
  revenue: number;
  delivered: number;
  delayed: number;
  onTimeRate: number; // 0-100, of closed shipments
  totalCo2Kg: number;
}

function buildExecutiveSummary(periodShipments: Shipment[]): ExecutiveSummary {
  const delivered = periodShipments.filter((s) => s.status === "delivered").length;
  const delayed = periodShipments.filter((s) => s.status === "delayed" || s.status === "exception").length;
  const closed = delivered + delayed;
  return {
    shipmentCount: periodShipments.length,
    revenue: Math.round(computeRevenue(periodShipments)),
    delivered,
    delayed,
    onTimeRate: closed > 0 ? Math.round((delivered / closed) * 100) : 0,
    totalCo2Kg: Math.round(periodShipments.reduce((a, s) => a + shipmentEmissions(s), 0) * 10) / 10,
  };
}

// ---- Section: Cost optimization --------------------------------------------
export interface CostInsight {
  totalCost: number;
  avgCostPerShipment: number;
  costPerKm: number;
  topLanes: { lane: string; totalCost: number; shipments: number }[];
}

function buildCostInsight(periodShipments: Shipment[], warehouseById: Map<string, Warehouse>): CostInsight {
  let totalCost = 0;
  let totalKm = 0;
  const laneMap = new Map<string, { totalCost: number; shipments: number }>();

  for (const s of periodShipments) {
    const cost = shipmentCost(s).total;
    totalCost += cost;
    totalKm += s.distanceKm;
    const origin = warehouseById.get(s.originWarehouseId)?.name ?? "Unknown origin";
    const lane = `${origin} → ${s.destinationCity || "Unknown"}`;
    const cur = laneMap.get(lane) ?? { totalCost: 0, shipments: 0 };
    cur.totalCost += cost;
    cur.shipments += 1;
    laneMap.set(lane, cur);
  }

  const topLanes = Array.from(laneMap.entries())
    .map(([lane, v]) => ({ lane, totalCost: Math.round(v.totalCost), shipments: v.shipments }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  return {
    totalCost: Math.round(totalCost),
    avgCostPerShipment: periodShipments.length ? Math.round(totalCost / periodShipments.length) : 0,
    costPerKm: totalKm > 0 ? Math.round((totalCost / totalKm) * 100) / 100 : 0,
    topLanes,
  };
}

// ---- Section: Fleet & warehouse utilization --------------------------------
export interface UtilizationInsight {
  avgWarehouseUtil: number;
  warehouses: { name: string; pct: number }[];
  activeVehiclePct: number;
  vehiclesInMaintenance: number;
}

function buildUtilizationInsight(warehouses: Warehouse[], vehicles: Vehicle[]): UtilizationInsight {
  const whUtil = warehouseUtilization(warehouses);
  const avg = whUtil.length ? Math.round(whUtil.reduce((a, w) => a + w.pct, 0) / whUtil.length) : 0;
  const active = vehicles.filter((v) => v.status === "active").length;
  return {
    avgWarehouseUtil: avg,
    warehouses: whUtil.map((w) => ({ name: w.name, pct: w.pct })).sort((a, b) => b.pct - a.pct),
    activeVehiclePct: vehicles.length ? Math.round((active / vehicles.length) * 100) : 0,
    vehiclesInMaintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };
}

// ---- Section: Customer trends -----------------------------------------------
export interface CustomerInsight {
  topCustomers: { name: string; shipments: number; spend: number }[];
  newCustomers: number;
}

function buildCustomerInsight(
  periodShipments: Shipment[],
  customers: Customer[],
  range: ReportRange,
): CustomerInsight {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const agg = new Map<string, { shipments: number; spend: number }>();
  for (const s of periodShipments) {
    const name = customerById.get(s.customerId)?.company ?? "Unknown customer";
    const cur = agg.get(name) ?? { shipments: 0, spend: 0 };
    cur.shipments += 1;
    cur.spend += shipmentCost(s).total;
    agg.set(name, cur);
  }
  const topCustomers = Array.from(agg.entries())
    .map(([name, v]) => ({ name, shipments: v.shipments, spend: Math.round(v.spend) }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return {
    topCustomers,
    newCustomers: customers.filter((c) => inRange(c.createdAt, range)).length,
  };
}

// ---- Section: Hidden bottlenecks -------------------------------------------
export interface Bottleneck {
  id: string;
  severity: "medium" | "high";
  title: string;
  detail: string;
}

function buildBottlenecks(
  periodShipments: Shipment[],
  warehouses: Warehouse[],
  vehicles: Vehicle[],
): Bottleneck[] {
  const out: Bottleneck[] = [];

  for (const w of warehouses) {
    const pct = w.capacityUnits > 0 ? (w.usedUnits / w.capacityUnits) * 100 : 0;
    if (pct >= 90) {
      out.push({
        id: `wh-${w.id}`,
        severity: pct >= 97 ? "high" : "medium",
        title: `${w.name} is at ${Math.round(pct)}% capacity`,
        detail: "Inbound volume risks overflow — consider diverting or expanding capacity.",
      });
    }
  }

  const exceptionCount = periodShipments.filter((s) => s.status === "exception").length;
  if (exceptionCount >= 2) {
    out.push({
      id: "exceptions",
      severity: exceptionCount >= 5 ? "high" : "medium",
      title: `${exceptionCount} shipment exceptions this period`,
      detail: "Recurring exceptions above baseline — investigate the common carrier or lane.",
    });
  }

  const maintPct = vehicles.length
    ? (vehicles.filter((v) => v.status === "maintenance").length / vehicles.length) * 100
    : 0;
  if (maintPct >= 25) {
    out.push({
      id: "fleet-maint",
      severity: maintPct >= 40 ? "high" : "medium",
      title: `${Math.round(maintPct)}% of fleet in maintenance`,
      detail: "Reduced delivery capacity — schedule may need reprioritization.",
    });
  }

  // Lane concentration risk: one destination driving an outsized share of volume.
  const destCounts = new Map<string, number>();
  for (const s of periodShipments) destCounts.set(s.destinationCity, (destCounts.get(s.destinationCity) ?? 0) + 1);
  if (periodShipments.length >= 6) {
    for (const [dest, count] of destCounts) {
      const share = count / periodShipments.length;
      if (share >= 0.4) {
        out.push({
          id: `conc-${dest}`,
          severity: share >= 0.6 ? "high" : "medium",
          title: `${Math.round(share * 100)}% of volume concentrated in ${dest || "one destination"}`,
          detail: "A disruption on this lane would disproportionately impact operations.",
        });
      }
    }
  }

  return out.sort((a, b) => (b.severity === "high" ? 1 : 0) - (a.severity === "high" ? 1 : 0));
}

// ---- Full report -------------------------------------------------------------
export interface Report {
  period: ReportPeriod;
  range: ReportRange;
  generatedAt: string;
  summary: ExecutiveSummary;
  cost: CostInsight;
  utilization: UtilizationInsight;
  customers: CustomerInsight;
  bottlenecks: Bottleneck[];
}

export interface ReportInput {
  shipments: Shipment[];
  warehouses: Warehouse[];
  vehicles: Vehicle[];
  customers: Customer[];
  invoices: Invoice[];
}

export function buildReport(input: ReportInput, period: ReportPeriod, nowMs: number): Report {
  const range = reportRange(period, nowMs);
  const periodShipments = input.shipments.filter((s) => inRange(s.createdAt, range));
  const warehouseById = new Map(input.warehouses.map((w) => [w.id, w]));

  return {
    period,
    range,
    generatedAt: new Date(nowMs).toISOString(),
    summary: buildExecutiveSummary(periodShipments),
    cost: buildCostInsight(periodShipments, warehouseById),
    utilization: buildUtilizationInsight(input.warehouses, input.vehicles),
    customers: buildCustomerInsight(periodShipments, input.customers, range),
    bottlenecks: buildBottlenecks(periodShipments, input.warehouses, input.vehicles),
  };
}

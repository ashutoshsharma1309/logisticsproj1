import type {
  Shipment,
  Warehouse,
  Vehicle,
  Driver,
  Customer,
  Invoice,
} from "@/lib/db/types";
import type { TimeSeriesPoint, TransportMode, ShipmentStatus } from "@/types";
import { shipmentCost, shipmentEmissions } from "@/lib/domain/calc";
import { formatCompact, formatCurrency } from "@/lib/utils";

export interface DataBundle {
  shipments: Shipment[];
  warehouses: Warehouse[];
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  invoices: Invoice[];
}

export interface Stat {
  id: string;
  label: string;
  value: number;
  display: string;
  hint: string;
  icon: string;
  empty: boolean;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeRevenue(shipments: Shipment[]): number {
  return shipments.reduce((a, s) => a + shipmentCost(s).total, 0);
}

export function computeStats(data: DataBundle, currency: string): Stat[] {
  const { shipments, warehouses, vehicles, drivers, customers } = data;
  const revenue = computeRevenue(shipments);
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const delayed = shipments.filter((s) => s.status === "delayed" || s.status === "exception").length;
  const active = shipments.filter(
    (s) => !["delivered", "exception"].includes(s.status),
  ).length;
  const closed = delivered + delayed;
  const onTime = closed > 0 ? Math.round((delivered / closed) * 100) : 0;
  const co2 = shipments.reduce((a, s) => a + shipmentEmissions(s), 0);
  const totalCap = warehouses.reduce((a, w) => a + w.capacityUnits, 0);
  const usedCap = warehouses.reduce((a, w) => a + w.usedUnits, 0);
  const util = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;

  return [
    stat("revenue", "Total Shipment Value", revenue, revenue ? formatCurrency(revenue, currency) : "—", shipments.length ? `Across ${shipments.length} shipments` : "No shipments yet", "DollarSign"),
    stat("active", "Active Shipments", active, active ? String(active) : "—", shipments.length ? `${shipments.length} total` : "Create your first shipment", "Package"),
    stat("delivered", "Delivered", delivered, delivered ? String(delivered) : "—", closed ? `${onTime}% on-time` : "No completed deliveries", "CheckCircle2"),
    stat("delayed", "Delayed / Exceptions", delayed, delayed ? String(delayed) : "—", shipments.length ? "Needs attention" : "Nothing flagged", "AlertTriangle"),
    stat("fleet", "Fleet", vehicles.length, vehicles.length ? String(vehicles.length) : "—", vehicles.length ? `${activeVehicles} active` : "Register a vehicle", "Truck"),
    stat("drivers", "Drivers", drivers.length, drivers.length ? String(drivers.length) : "—", drivers.length ? "On roster" : "Add a driver", "Users"),
    stat("co2", "Est. CO₂ Emissions", co2, co2 ? `${formatCompact(co2)} kg` : "—", shipments.length ? "From weight × distance" : "No data yet", "Leaf"),
    stat("warehouse", "Warehouse Utilization", util, warehouses.length ? `${util}%` : "—", warehouses.length ? `${formatCompact(usedCap)}/${formatCompact(totalCap)} units` : "Add a warehouse", "Warehouse"),
    stat("customers", "Customers", customers.length, customers.length ? String(customers.length) : "—", customers.length ? "Active accounts" : "Add a customer", "Contact"),
  ];
}

function stat(id: string, label: string, value: number, display: string, hint: string, icon: string): Stat {
  return { id, label, value, display, hint, icon, empty: value === 0 };
}

// ---- time series (all derived from stored records) -------------------------
function monthKey(iso: string): string {
  const d = new Date(iso);
  return MONTH[d.getMonth()] ?? "—";
}

export function revenueTrend(shipments: Shipment[]): TimeSeriesPoint[] {
  if (shipments.length === 0) return [];
  const byMonth = new Map<string, { revenue: number; cost: number }>();
  for (const s of shipments) {
    const k = monthKey(s.createdAt);
    const c = shipmentCost(s);
    const cur = byMonth.get(k) ?? { revenue: 0, cost: 0 };
    cur.revenue += c.total;
    cur.cost += c.subtotal - c.freight; // operating cost proxy = non-freight costs
    byMonth.set(k, cur);
  }
  return orderMonths(byMonth).map(([label, v]) => ({
    label,
    revenue: Math.round(v.revenue),
    cost: Math.round(v.cost),
  }));
}

export function deliveryTrend(shipments: Shipment[]): TimeSeriesPoint[] {
  if (shipments.length === 0) return [];
  const byMonth = new Map<string, { delivered: number; delayed: number }>();
  for (const s of shipments) {
    const k = monthKey(s.createdAt);
    const cur = byMonth.get(k) ?? { delivered: 0, delayed: 0 };
    if (s.status === "delivered") cur.delivered += 1;
    if (s.status === "delayed" || s.status === "exception") cur.delayed += 1;
    byMonth.set(k, cur);
  }
  return orderMonths(byMonth).map(([label, v]) => ({ label, ...v }));
}

function orderMonths<V>(map: Map<string, V>): [string, V][] {
  return MONTH.filter((m) => map.has(m)).map((m) => [m, map.get(m)!]);
}

export function modeSplit(shipments: Shipment[]): TimeSeriesPoint[] {
  if (shipments.length === 0) return [];
  const modes: TransportMode[] = ["truck", "ship", "plane", "rail"];
  return modes
    .map((mode) => ({
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
      value: shipments.filter((s) => s.mode === mode).length,
    }))
    .filter((d) => d.value > 0);
}

export function statusSplit(shipments: Shipment[]): TimeSeriesPoint[] {
  if (shipments.length === 0) return [];
  const map = new Map<ShipmentStatus, number>();
  for (const s of shipments) map.set(s.status, (map.get(s.status) ?? 0) + 1);
  return Array.from(map.entries()).map(([status, value]) => ({
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));
}

export function costBreakdown(shipments: Shipment[]): TimeSeriesPoint[] {
  if (shipments.length === 0) return [];
  const totals = { Freight: 0, Fuel: 0, Packaging: 0, Insurance: 0, Tax: 0, Other: 0 };
  for (const s of shipments) {
    const c = shipmentCost(s);
    totals.Freight += c.freight;
    totals.Fuel += c.fuel;
    totals.Packaging += c.packaging;
    totals.Insurance += c.insurance;
    totals.Tax += c.tax;
    totals.Other += c.other;
  }
  return Object.entries(totals)
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .filter((d) => d.value > 0);
}

export function fleetStatusSplit(vehicles: Vehicle[]): TimeSeriesPoint[] {
  if (vehicles.length === 0) return [];
  const statuses: Vehicle["status"][] = ["active", "idle", "maintenance"];
  return statuses
    .map((st) => ({
      label: st.charAt(0).toUpperCase() + st.slice(1),
      value: vehicles.filter((v) => v.status === st).length,
    }))
    .filter((d) => d.value > 0);
}

export function warehouseUtilization(
  warehouses: Warehouse[],
): { name: string; used: number; capacity: number; pct: number }[] {
  return warehouses.map((w) => ({
    name: w.name,
    used: w.usedUnits,
    capacity: w.capacityUnits,
    pct: w.capacityUnits > 0 ? Math.round((w.usedUnits / w.capacityUnits) * 100) : 0,
  }));
}

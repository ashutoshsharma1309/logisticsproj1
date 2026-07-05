import { getStore } from "@/services/store";
import { seededRandom } from "@/lib/hash";
import { formatCompact, formatCurrency } from "@/lib/utils";
import type { KpiMetric, TimeSeriesPoint } from "@/types";

const rnd = seededRandom(884422);

function spark(base: number, volatility: number, n = 12): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v = Math.max(0, v + (rnd() - 0.45) * volatility);
    out.push(Math.round(v));
  }
  return out;
}

export function getKpis(): KpiMetric[] {
  const { shipments, warehouses, vehicles } = getStore();
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const delayed = shipments.filter(
    (s) => s.status === "delayed" || s.status === "exception",
  ).length;
  const revenue = shipments.reduce((a, s) => a + s.valueUsd, 0);
  const avgEta = 4.6;
  const co2 = shipments.reduce((a, s) => a + s.co2Kg, 0);
  const avgWh =
    warehouses.reduce((a, w) => a + w.utilization, 0) / warehouses.length;
  const fleetHealth =
    vehicles.reduce((a, v) => a + v.healthScore, 0) / vehicles.length;

  return [
    {
      id: "revenue",
      label: "Cargo Value in Network",
      value: revenue,
      formatted: formatCurrency(revenue),
      delta: 12.4,
      trend: "up",
      positive: true,
      spark: spark(120, 30),
      icon: "DollarSign",
    },
    {
      id: "deliveries",
      label: "Active Shipments",
      value: shipments.length,
      formatted: String(shipments.length),
      delta: 8.1,
      trend: "up",
      positive: true,
      spark: spark(80, 18),
      icon: "Package",
    },
    {
      id: "delayed",
      label: "Delayed / Exceptions",
      value: delayed,
      formatted: String(delayed),
      delta: -3.2,
      trend: "down",
      positive: true,
      spark: spark(30, 12),
      icon: "AlertTriangle",
    },
    {
      id: "completed",
      label: "Completed Orders",
      value: delivered,
      formatted: String(delivered),
      delta: 6.7,
      trend: "up",
      positive: true,
      spark: spark(40, 10),
      icon: "CheckCircle2",
    },
    {
      id: "fleet",
      label: "Fleet Health Index",
      value: Math.round(fleetHealth),
      formatted: `${Math.round(fleetHealth)}%`,
      delta: 1.4,
      trend: "up",
      positive: true,
      spark: spark(85, 6),
      icon: "Truck",
    },
    {
      id: "eta",
      label: "Average ETA",
      value: avgEta,
      formatted: `${avgEta} days`,
      delta: -5.9,
      trend: "down",
      positive: true,
      spark: spark(50, 8),
      icon: "Clock",
    },
    {
      id: "co2",
      label: "Carbon Emissions",
      value: co2,
      formatted: `${formatCompact(co2)} kg`,
      delta: -9.3,
      trend: "down",
      positive: true,
      spark: spark(70, 14),
      icon: "Leaf",
    },
    {
      id: "warehouse",
      label: "Warehouse Utilization",
      value: Math.round(avgWh),
      formatted: `${Math.round(avgWh)}%`,
      delta: 2.8,
      trend: "up",
      positive: true,
      spark: spark(72, 8),
      icon: "Warehouse",
    },
  ];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getDeliveryTrend(): TimeSeriesPoint[] {
  let d = 620;
  let del = 90;
  return MONTHS.map((m) => {
    d = Math.round(d + (rnd() - 0.35) * 120);
    del = Math.max(20, Math.round(del + (rnd() - 0.5) * 40));
    return { label: m, delivered: d, delayed: del, forecast: Math.round(d * (1 + (rnd() - 0.3) * 0.2)) };
  });
}

export function getRevenueTrend(): TimeSeriesPoint[] {
  let r = 1_800_000;
  return MONTHS.map((m) => {
    r = Math.round(r * (1 + (rnd() - 0.35) * 0.14));
    return { label: m, revenue: r, cost: Math.round(r * (0.52 + rnd() * 0.1)) };
  });
}

export function getModeSplit(): TimeSeriesPoint[] {
  const { shipments } = getStore();
  const modes = ["truck", "ship", "plane", "rail"] as const;
  return modes.map((mode) => ({
    label: mode.charAt(0).toUpperCase() + mode.slice(1),
    value: shipments.filter((s) => s.mode === mode).length,
  }));
}

export function getRiskDistribution(): TimeSeriesPoint[] {
  const { shipments } = getStore();
  const levels = ["low", "medium", "high", "critical"] as const;
  return levels.map((level) => ({
    label: level.charAt(0).toUpperCase() + level.slice(1),
    value: shipments.filter((s) => s.riskLevel === level).length,
  }));
}

export function getStatusDistribution(): TimeSeriesPoint[] {
  const { shipments } = getStore();
  const map = new Map<string, number>();
  for (const s of shipments) map.set(s.status, (map.get(s.status) ?? 0) + 1);
  return Array.from(map.entries()).map(([label, value]) => ({
    label: label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));
}

export function getFuelTrend(): TimeSeriesPoint[] {
  let f = 100;
  return MONTHS.slice(0, 8).map((m) => {
    f = Math.max(60, f + (rnd() - 0.5) * 20);
    return {
      label: m,
      diesel: Math.round(f),
      electric: Math.round(f * (0.35 + rnd() * 0.15)),
      hydrogen: Math.round(f * (0.12 + rnd() * 0.08)),
    };
  });
}

export function getWarehouseHeatmap(): { name: string; zones: number[] }[] {
  const { warehouses } = getStore();
  return warehouses.map((w) => ({
    name: w.name,
    zones: Array.from({ length: 8 }, () => Math.round(rnd() * 100)),
  }));
}

export function getPredictionCurve(): TimeSeriesPoint[] {
  const days = ["D+1", "D+2", "D+3", "D+4", "D+5", "D+6", "D+7"];
  let actual = 88;
  return days.map((label, i) => {
    actual = Math.min(99, actual + (rnd() - 0.4) * 6);
    return {
      label,
      predicted: Math.round(actual),
      lower: Math.round(actual - 4 - rnd() * 3),
      upper: Math.round(Math.min(100, actual + 3 + rnd() * 3)),
    };
  });
}

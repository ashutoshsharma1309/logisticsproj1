import type { KpiMetric, TimeSeriesPoint, SimNode, SimRoute } from "@/types";
import { HUBS } from "@/lib/geo";

/**
 * Static ILLUSTRATIVE dataset for the marketing landing page previews ONLY.
 * This is a product screenshot analog (like any SaaS landing "dashboard preview"),
 * never rendered inside the authenticated app — the app itself starts empty and
 * shows only user-entered data. Kept isolated here so no fabricated business data
 * can leak into the product.
 */

export const previewKpis: KpiMetric[] = [
  {
    id: "revenue",
    label: "Shipment value",
    value: 482000,
    formatted: "$482K",
    delta: 12.4,
    trend: "up",
    positive: true,
    spark: [120, 132, 128, 145, 150, 148, 162, 170, 168, 182, 190, 205],
    icon: "DollarSign",
  },
  {
    id: "onTime",
    label: "On-time rate",
    value: 96,
    formatted: "96%",
    delta: 3.1,
    trend: "up",
    positive: true,
    spark: [88, 90, 89, 91, 92, 93, 92, 94, 95, 95, 96, 96],
    icon: "CheckCircle2",
  },
  {
    id: "co2",
    label: "CO₂ saved",
    value: 34,
    formatted: "34%",
    delta: 9.3,
    trend: "up",
    positive: true,
    spark: [10, 14, 18, 20, 22, 25, 27, 28, 30, 31, 33, 34],
    icon: "Leaf",
  },
];

export const previewDeliveryTrend: TimeSeriesPoint[] = [
  { label: "Jan", delivered: 620, forecast: 640 },
  { label: "Feb", delivered: 680, forecast: 700 },
  { label: "Mar", delivered: 740, forecast: 720 },
  { label: "Apr", delivered: 710, forecast: 760 },
  { label: "May", delivered: 820, forecast: 800 },
  { label: "Jun", delivered: 890, forecast: 880 },
];

const node = (id: string, label: string, x: number, y: number, glow: boolean): SimNode => ({
  id,
  type: "hub",
  label,
  x,
  y,
  glow,
});

export const previewSimNodes: SimNode[] = [
  node("p0", HUBS.losAngeles.label, HUBS.losAngeles.x, HUBS.losAngeles.y, true),
  node("p1", HUBS.newYork.label, HUBS.newYork.x, HUBS.newYork.y, false),
  node("p2", HUBS.rotterdam.label, HUBS.rotterdam.x, HUBS.rotterdam.y, true),
  node("p3", HUBS.dubai.label, HUBS.dubai.x, HUBS.dubai.y, false),
  node("p4", HUBS.singapore.label, HUBS.singapore.x, HUBS.singapore.y, true),
  node("p5", HUBS.shanghai.label, HUBS.shanghai.x, HUBS.shanghai.y, false),
];

const route = (
  id: string,
  from: SimNode,
  to: SimNode,
  mode: SimRoute["mode"],
  progress: number,
  ref: string,
): SimRoute => ({
  id,
  from: from.label.split(",")[0]!,
  to: to.label.split(",")[0]!,
  mode,
  fromPoint: { x: from.x, y: from.y },
  toPoint: { x: to.x, y: to.y },
  controlPoint: { x: (from.x + to.x) / 2, y: Math.max(3, (from.y + to.y) / 2 - 8) },
  shipmentRef: ref,
  progress,
  healthScore: 92,
});

export const previewSimRoutes: SimRoute[] = [
  route("r0", previewSimNodes[4]!, previewSimNodes[0]!, "ship", 0.35, "CR-100482"),
  route("r1", previewSimNodes[2]!, previewSimNodes[1]!, "plane", 0.6, "CR-100517"),
  route("r2", previewSimNodes[5]!, previewSimNodes[3]!, "ship", 0.2, "CR-100603"),
  route("r3", previewSimNodes[0]!, previewSimNodes[1]!, "truck", 0.75, "CR-100641"),
];

export const previewBlockCount = 128;

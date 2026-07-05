import { getStore } from "@/services/store";
import { HUB_LIST } from "@/lib/geo";
import { seededRandom } from "@/lib/hash";
import type { SimNode, SimRoute } from "@/types";

const rnd = seededRandom(551234);

export function getSimNodes(): SimNode[] {
  const { warehouses } = getStore();
  const hubNodes: SimNode[] = HUB_LIST.slice(0, 14).map((h, i) => ({
    id: `node_${i}`,
    type: i % 3 === 0 ? "port" : i % 3 === 1 ? "airport" : "hub",
    label: h.label,
    x: h.x,
    y: h.y,
    glow: i % 4 === 0,
  }));
  const whNodes: SimNode[] = warehouses.map((w, i) => ({
    id: `wnode_${i}`,
    type: "warehouse",
    label: w.name,
    x: w.x,
    y: w.y,
    glow: i % 3 === 0,
  }));
  return [...hubNodes, ...whNodes];
}

export function getSimRoutes(count = 8): SimRoute[] {
  const { shipments } = getStore();
  const modes = ["truck", "ship", "plane", "rail"] as const;
  const active = shipments
    .filter((s) => s.status === "in_transit" || s.status === "out_for_delivery")
    .slice(0, count);

  return active.map((s, i) => {
    const from = { x: s.origin.x, y: s.origin.y };
    const to = { x: s.destination.x, y: s.destination.y };
    // Arc the control point above the midpoint for a great-circle feel.
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const lift = 6 + rnd() * 10;
    return {
      id: `route_${i}`,
      from: s.origin.label.split(",")[0]!,
      to: s.destination.label.split(",")[0]!,
      mode: s.mode,
      fromPoint: from,
      toPoint: to,
      controlPoint: { x: mx, y: Math.max(2, my - lift) },
      shipmentRef: s.reference,
      progress: (i * 0.13) % 1,
      healthScore: s.healthScore,
    };
  });
}

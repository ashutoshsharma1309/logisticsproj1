import { HUB_LIST, lngToX, latToY } from "@/lib/geo";
import { stringToSeed } from "@/lib/hash";
import type { Shipment, Warehouse } from "@/lib/db/types";
import type { SimNode, SimRoute, ShipmentStatus, TransportMode } from "@/types";

/**
 * Derives the logistics network graph (nodes + routes) from the user's real
 * shipments and warehouses. Shared by the schematic SVG map (Command Center,
 * Simulation) and the geospatial Digital Twin — both need the same stable
 * placement of free-text places, so it lives here once.
 */

export const ACTIVE_STATUSES: ReadonlySet<ShipmentStatus> = new Set<ShipmentStatus>([
  "pending",
  "in_transit",
  "at_warehouse",
  "customs",
  "out_for_delivery",
  "delayed",
  "exception",
]);

/** Deterministic health score derived purely from a shipment's status. */
export const STATUS_HEALTH: Record<ShipmentStatus, number> = {
  pending: 72,
  in_transit: 88,
  at_warehouse: 82,
  customs: 76,
  out_for_delivery: 92,
  delivered: 100,
  delayed: 44,
  exception: 28,
};

/**
 * Map any user-entered place name to a stable real-world-ish coordinate near a
 * known hub. Warehouses/destinations are free text without coordinates, so we
 * hash the name to pick a hub and apply a small deterministic offset — identical
 * names always resolve to the same point, so the network is reproducible.
 */
export function geoForName(name: string): { lat: number; lng: number } {
  const seed = stringToSeed(name);
  const hub = HUB_LIST[seed % HUB_LIST.length]!;
  const offLng = (((seed >>> 7) % 1000) / 1000 - 0.5) * 12; // ±6°
  const offLat = (((seed >>> 17) % 1000) / 1000 - 0.5) * 10; // ±5°
  return { lat: hub.lat + offLat, lng: hub.lng + offLng };
}

/** Projected x/y (0–100) for the schematic SVG map. */
export function pointForName(name: string): { x: number; y: number } {
  const { lat, lng } = geoForName(name);
  return { x: lngToX(lng), y: latToY(lat) };
}

export function shortLabel(value: string): string {
  return value.split(",")[0]!.trim();
}

export interface NetworkModel {
  routes: SimRoute[];
  nodes: SimNode[];
}

export function buildNetworkModel(shipments: Shipment[], warehouses: Warehouse[]): NetworkModel {
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const active = shipments.filter((s) => ACTIVE_STATUSES.has(s.status));

  const nodeMap = new Map<string, SimNode>();
  const upsertNode = (label: string, isWarehouse: boolean): SimNode => {
    const existing = nodeMap.get(label);
    if (existing) {
      if (isWarehouse && !existing.glow) {
        const promoted: SimNode = { ...existing, type: "warehouse", glow: true };
        nodeMap.set(label, promoted);
        return promoted;
      }
      return existing;
    }
    const point = pointForName(label);
    const node: SimNode = {
      id: `node-${stringToSeed(label).toString(36)}`,
      type: isWarehouse ? "warehouse" : "city",
      label,
      x: point.x,
      y: point.y,
      glow: isWarehouse,
    };
    nodeMap.set(label, node);
    return node;
  };

  const routes: SimRoute[] = active.map((s, i) => {
    const warehouse = warehouseById.get(s.originWarehouseId);
    const originLabel = warehouse ? warehouse.name : "Origin";
    const destLabel = s.destinationCity || "Destination";

    const fromNode = upsertNode(originLabel, true);
    const toNode = upsertNode(destLabel, false);
    const fromPoint = { x: fromNode.x, y: fromNode.y };
    const toPoint = { x: toNode.x, y: toNode.y };
    const mx = (fromPoint.x + toPoint.x) / 2;
    const my = (fromPoint.y + toPoint.y) / 2;
    const dist = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
    const lift = 5 + dist * 0.28;

    return {
      id: `route-${s.id}`,
      from: shortLabel(originLabel),
      to: shortLabel(destLabel),
      mode: s.mode,
      fromPoint,
      toPoint,
      controlPoint: { x: mx, y: Math.max(2, my - lift) },
      shipmentRef: s.reference,
      progress: (i * 0.13) % 1,
      healthScore: STATUS_HEALTH[s.status],
    };
  });

  return { routes, nodes: Array.from(nodeMap.values()) };
}

// ---- Geospatial model (real lat/lng) for the MapLibre Digital Twin ----------

export interface GeoPointLL {
  lat: number;
  lng: number;
  label: string;
}

export interface GeoRoute {
  id: string;
  shipmentRef: string;
  mode: TransportMode;
  status: ShipmentStatus;
  healthScore: number;
  from: GeoPointLL;
  to: GeoPointLL;
}

export interface GeoNode extends GeoPointLL {
  id: string;
  type: "warehouse" | "city";
}

export interface GeoModel {
  routes: GeoRoute[];
  nodes: GeoNode[];
}

/**
 * Builds the network in real geographic coordinates (lat/lng) for the Digital
 * Twin. Coordinates are derived deterministically from place names via
 * `geoForName`, so they're stable and consistent with the schematic map — no
 * geocoding API/secret required.
 */
export function buildGeoModel(shipments: Shipment[], warehouses: Warehouse[]): GeoModel {
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const active = shipments.filter((s) => ACTIVE_STATUSES.has(s.status));
  const nodeMap = new Map<string, GeoNode>();

  const upsert = (label: string, isWarehouse: boolean): GeoNode => {
    const existing = nodeMap.get(label);
    if (existing) {
      if (isWarehouse && existing.type !== "warehouse") {
        const promoted: GeoNode = { ...existing, type: "warehouse" };
        nodeMap.set(label, promoted);
        return promoted;
      }
      return existing;
    }
    const { lat, lng } = geoForName(label);
    const node: GeoNode = {
      id: `geo-${stringToSeed(label).toString(36)}`,
      label,
      lat,
      lng,
      type: isWarehouse ? "warehouse" : "city",
    };
    nodeMap.set(label, node);
    return node;
  };

  const routes: GeoRoute[] = active.map((s) => {
    const warehouse = warehouseById.get(s.originWarehouseId);
    const originLabel = warehouse ? warehouse.name : "Origin";
    const destLabel = s.destinationCity || "Destination";
    const from = upsert(originLabel, true);
    const to = upsert(destLabel, false);
    return {
      id: `georoute-${s.id}`,
      shipmentRef: s.reference,
      mode: s.mode,
      status: s.status,
      healthScore: STATUS_HEALTH[s.status],
      from: { lat: from.lat, lng: from.lng, label: from.label },
      to: { lat: to.lat, lng: to.lng, label: to.label },
    };
  });

  return { routes, nodes: Array.from(nodeMap.values()) };
}

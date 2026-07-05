"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Boxes,
  Brain,
  Gauge,
  MapPin,
  Pause,
  Play,
  Plane,
  Radar,
  Radio,
  RotateCcw,
  Ship,
  Sparkles,
  Train,
  Truck,
  Waypoints,
  Weight,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { WorldMap } from "@/components/map/world-map";
import { RadialGauge } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { useSimulation } from "@/hooks/use-simulation";
import { HUB_LIST, lngToX, latToY } from "@/lib/geo";
import { stringToSeed } from "@/lib/hash";
import { MODE_META, integrityVariant } from "@/config/status";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type {
  ShipmentStatus,
  SimNode,
  SimRoute,
  TransportMode,
} from "@/types";
import type { Shipment, Warehouse } from "@/lib/db/types";

const MODE_ICON: Record<TransportMode, React.ElementType> = {
  truck: Truck,
  ship: Ship,
  plane: Plane,
  rail: Train,
};

const SPEEDS = [0.5, 1, 2, 4] as const;

/** Statuses that are still "in motion" and worth animating on the network. */
const ACTIVE_STATUSES: ReadonlySet<ShipmentStatus> = new Set<ShipmentStatus>([
  "pending",
  "in_transit",
  "at_warehouse",
  "customs",
  "out_for_delivery",
  "delayed",
  "exception",
]);

/** Deterministic health score derived purely from a shipment's status. */
const STATUS_HEALTH: Record<ShipmentStatus, number> = {
  pending: 72,
  in_transit: 88,
  at_warehouse: 82,
  customs: 76,
  out_for_delivery: 92,
  delivered: 100,
  delayed: 44,
  exception: 28,
};

type Selection =
  | { type: "route"; id: string }
  | { type: "node"; id: string }
  | null;

/**
 * Map any user-entered place name to a stable pseudo-coordinate near a real
 * hub. Warehouses/destinations are free-text without coordinates, so we hash
 * the name to pick a hub and apply a small deterministic offset — identical
 * names always land on the same point, so the network is reproducible.
 */
function pointForName(name: string): { x: number; y: number } {
  const seed = stringToSeed(name);
  const hub = HUB_LIST[seed % HUB_LIST.length]!;
  const offLng = (((seed >>> 7) % 1000) / 1000 - 0.5) * 12; // ±6°
  const offLat = (((seed >>> 17) % 1000) / 1000 - 0.5) * 10; // ±5°
  return { x: lngToX(hub.lng + offLng), y: latToY(hub.lat + offLat) };
}

function shortLabel(value: string): string {
  return value.split(",")[0]!.trim();
}

interface SimModel {
  routes: SimRoute[];
  nodes: SimNode[];
}

/** Build the network graph (routes + nodes) from the user's real shipments. */
function buildModel(shipments: Shipment[], warehouses: Warehouse[]): SimModel {
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const active = shipments.filter((s) => ACTIVE_STATUSES.has(s.status));

  const nodeMap = new Map<string, SimNode>();
  const upsertNode = (label: string, isWarehouse: boolean): SimNode => {
    const existing = nodeMap.get(label);
    if (existing) {
      if (isWarehouse && !existing.glow) {
        const promoted: SimNode = {
          ...existing,
          type: "warehouse",
          glow: true,
        };
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

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-clay">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-clay-sm",
          accent,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

interface BoardProps {
  initialRoutes: SimRoute[];
  nodes: SimNode[];
  shipmentByRef: Map<string, Shipment>;
}

/** The live simulator — only mounted once real routes exist. */
function SimulationBoard({ initialRoutes, nodes, shipmentByRef }: BoardProps) {
  const { routes, running, speed, events, setSpeed, toggle, play, reset } =
    useSimulation(initialRoutes);

  const [selection, setSelection] = React.useState<Selection>(null);

  const selectedRoute =
    selection?.type === "route"
      ? routes.find((r) => r.id === selection.id) ?? null
      : null;
  const selectedNode =
    selection?.type === "node"
      ? nodes.find((n) => n.id === selection.id) ?? null
      : null;

  const activeRouteId = selection?.type === "route" ? selection.id : null;

  const handleReplay = React.useCallback(() => {
    reset();
    play();
  }, [reset, play]);

  const RouteIcon = selectedRoute ? MODE_ICON[selectedRoute.mode] : null;
  const selectedShipment = selectedRoute
    ? shipmentByRef.get(selectedRoute.shipmentRef) ?? null
    : null;

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatChip
          icon={Waypoints}
          label="Shipments Simulated"
          value={formatNumber(routes.length)}
          accent="bg-primary/15 text-primary"
        />
        <StatChip
          icon={MapPin}
          label="Active Routes"
          value={formatNumber(routes.length)}
          accent="bg-secondary/15 text-secondary"
        />
        <StatChip
          icon={Boxes}
          label="Blocks This Session"
          value={formatNumber(events.length)}
          accent="bg-accent/15 text-accent"
        />
        <StatChip
          icon={Gauge}
          label="Sim Speed"
          value={`${speed}×`}
          accent="bg-success/15 text-success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Map panel */}
        <div className="clay-lg relative h-[520px] overflow-hidden rounded-3xl bg-card">
          <WorldMap
            nodes={nodes}
            routes={routes}
            activeRouteId={activeRouteId}
            onRouteClick={(r) => setSelection({ type: "route", id: r.id })}
            onNodeClick={(n) => setSelection({ type: "node", id: n.id })}
            className="h-full"
          />

          {/* Live indicator */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 shadow-clay-sm backdrop-blur-sm">
            <Radio
              className={cn(
                "h-3.5 w-3.5",
                running
                  ? "animate-pulse text-success"
                  : "text-muted-foreground",
              )}
            />
            <span className="text-xs font-semibold">
              {running ? "Live" : "Paused"}
            </span>
          </div>

          {/* Floating control bar */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-card/85 p-2 shadow-clay-lg backdrop-blur-md">
            <Button
              size="sm"
              variant={running ? "secondary" : "gradient"}
              onClick={toggle}
              aria-label={running ? "Pause simulation" : "Play simulation"}
            >
              {running ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {running ? "Pause" : "Play"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={reset}
              aria-label="Reset simulation"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div
              className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 shadow-clay-inset"
              role="group"
              aria-label="Simulation speed"
            >
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
                    speed === s
                      ? "bg-primary text-primary-foreground shadow-clay-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              size="sm"
              variant="clay"
              onClick={handleReplay}
              aria-label="Replay simulation"
            >
              <Sparkles className="h-4 w-4" />
              Replay
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inspector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-primary" />
                Inspector
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoute && RouteIcon ? (
                <FadeIn key={selectedRoute.id} y={12} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">
                      {selectedRoute.shipmentRef}
                    </span>
                    <Badge variant="outline" className="gap-1">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {MODE_META[selectedRoute.mode].label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm shadow-clay-inset">
                    <span className="font-medium">{selectedRoute.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{selectedRoute.to}</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <RadialGauge
                      value={selectedRoute.healthScore}
                      label="Health"
                      size={150}
                      color={
                        selectedRoute.healthScore >= 80
                          ? "hsl(var(--success))"
                          : selectedRoute.healthScore >= 60
                            ? "hsl(var(--warning))"
                            : "hsl(var(--destructive))"
                      }
                    />
                  </div>

                  {selectedShipment ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-muted/40 p-2.5 shadow-clay-inset">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Status
                        </p>
                        <div className="mt-1 flex justify-center">
                          <StatusBadge status={selectedShipment.status} />
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2.5 shadow-clay-inset">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Priority
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize">
                          {selectedShipment.priority}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2.5 shadow-clay-inset">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Weight
                        </p>
                        <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold tabular-nums">
                          <Weight className="h-3 w-3" />
                          {formatNumber(selectedShipment.weightKg)}kg
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Source shipment no longer available.
                    </p>
                  )}
                </FadeIn>
              ) : selectedNode ? (
                <FadeIn key={selectedNode.id} y={12} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {selectedNode.label}
                    </span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedNode.type}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Grid X
                      </p>
                      <p className="font-mono font-semibold tabular-nums">
                        {selectedNode.x.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Grid Y
                      </p>
                      <p className="font-mono font-semibold tabular-nums">
                        {selectedNode.y.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Radio className="h-3.5 w-3.5" />
                    {selectedNode.type === "warehouse"
                      ? "Origin warehouse — broadcasting validator node in the mesh."
                      : "Destination relay node in the decentralized mesh."}
                  </p>
                </FadeIn>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-clay-inset">
                    <Waypoints className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Nothing selected</p>
                  <p className="max-w-[220px] text-xs text-muted-foreground">
                    Tap any moving shipment or network node on the map to inspect
                    its live telemetry and health.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minted blocks (this session) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-accent" />
                  Minted Blocks
                </span>
                <Badge variant="muted" className="tabular-nums">
                  {formatNumber(events.length)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Ephemeral simulation events for this session. The persisted chain
                lives on the Ledger page.
              </p>
              {events.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Awaiting first block</p>
                  <p className="max-w-[220px] text-xs text-muted-foreground">
                    As shipments cross checkpoints, freshly mined blocks stream in
                    here newest-first.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[340px] pr-3">
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {events.slice(0, 10).map((e) => (
                        <motion.div
                          key={e.id}
                          layout
                          initial={{ opacity: 0, y: -12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="rounded-xl bg-muted/40 p-3 shadow-clay-inset"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                #{e.blockIndex}
                              </span>
                              <StatusBadge status={e.status} />
                            </span>
                            <Badge variant={integrityVariant(e.integrityScore)}>
                              {e.integrityScore}%
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <HashBadge
                              value={e.hash}
                              label="HASH"
                              lead={6}
                              tail={4}
                              copyable={false}
                            />
                            <HashBadge
                              value={e.previousHash}
                              label="PREV"
                              lead={6}
                              tail={4}
                              copyable={false}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {e.verifier}
                            </span>
                            <span>{formatDateTime(e.timestamp)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function SimulationPage() {
  // Authed context is guaranteed by the dashboard layout; useAuth keeps this
  // page tied to the current org session.
  useAuth();
  const { items: shipments } = useCollection("shipments");
  const { items: warehouses } = useCollection("warehouses");

  const { routes, nodes } = React.useMemo(
    () => buildModel(shipments, warehouses),
    [shipments, warehouses],
  );

  const shipmentByRef = React.useMemo(
    () => new Map(shipments.map((s) => [s.reference, s])),
    [shipments],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Live Simulation"
        description="Watch your active shipments animate across the global network in real time. Each checkpoint they cross mints a fresh block into the simulated decentralized ledger — a live Blockchain Simulation, not a real chain."
      >
        <Badge variant="accent" className="gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Simulation Mode
        </Badge>
      </PageHeader>

      {routes.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Nothing to simulate yet"
          description="Add shipments with an origin and destination to watch them move across the network and mint ledger blocks."
          action={
            <Button asChild variant="gradient">
              <Link href="/dashboard/shipments?new=1">Add a shipment</Link>
            </Button>
          }
        />
      ) : (
        <SimulationBoard
          initialRoutes={routes}
          nodes={nodes}
          shipmentByRef={shipmentByRef}
        />
      )}
    </div>
  );
}

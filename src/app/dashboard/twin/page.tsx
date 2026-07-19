"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Boxes,
  Globe2,
  Pause,
  Play,
  Plane,
  Route as RouteIcon,
  Ship,
  ShieldAlert,
  Train,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCollection } from "@/hooks/use-collection";
import { useMounted } from "@/hooks/use-mounted";
import { buildGeoModel, geoForName } from "@/lib/network";
import { MODE_META } from "@/config/status";
import { cn } from "@/lib/utils";
import type { GeoRoute } from "@/lib/network";
import type { RiskZone, TwinLayers } from "@/components/twin/map-canvas";
import type { TransportMode } from "@/types";

const MapCanvas = dynamic(() => import("@/components/twin/map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 h-full w-full rounded-none" />,
});

const SPEEDS = [0.5, 1, 2, 4] as const;
const MODE_ICON: Record<TransportMode, React.ElementType> = {
  truck: Truck,
  ship: Ship,
  plane: Plane,
  rail: Train,
};
const MODE_LEGEND: { mode: TransportMode; color: string }[] = [
  { mode: "truck", color: "#6d4bff" },
  { mode: "ship", color: "#14b8a6" },
  { mode: "plane", color: "#a855f7" },
  { mode: "rail", color: "#f59e0b" },
];

function ToggleChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-card/80 text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

export default function DigitalTwinPage() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const { items: shipments } = useCollection("shipments");
  const { items: warehouses } = useCollection("warehouses");

  const model = React.useMemo(() => buildGeoModel(shipments, warehouses), [shipments, warehouses]);
  const risk = React.useMemo<RiskZone[]>(
    () =>
      shipments
        .filter((s) => s.status === "delayed" || s.status === "exception")
        .map((s) => {
          const g = geoForName(s.destinationCity || "Destination");
          return { lat: g.lat, lng: g.lng, label: s.destinationCity || s.reference };
        }),
    [shipments],
  );

  const [playing, setPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState(1);
  const [layers, setLayers] = React.useState<TwinLayers>({ routes: true, vehicles: true, risk: true });
  const [selected, setSelected] = React.useState<GeoRoute | null>(null);

  const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";
  const hasData = model.routes.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Twin"
        description="A live geospatial mirror of your logistics network — warehouses, animated shipments, and derived risk zones on a real map."
      >
        <Badge variant="warning" className="hidden sm:inline-flex">
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-warning" />
          Simulation Mode
        </Badge>
      </PageHeader>

      <Card className="relative overflow-hidden p-0">
        <div className="relative h-[560px] w-full lg:h-[calc(100vh-13rem)]">
          {!hasData ? (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                icon={Globe2}
                title="Nothing to simulate yet"
                description="Add shipments with an origin warehouse and a destination city to watch them move across the network in real geographic space."
                action={
                  <Button asChild>
                    <Link href="/dashboard/shipments?new=1">Create shipment</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            mounted && (
              <>
                <MapCanvas
                  model={model}
                  risk={risk}
                  playing={playing}
                  speed={speed}
                  layers={layers}
                  theme={theme}
                  onSelectRoute={setSelected}
                />

                {/* Top control bar */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/85 p-1.5 shadow-clay backdrop-blur">
                    <Button
                      size="icon-sm"
                      variant={playing ? "default" : "clay"}
                      onClick={() => setPlaying((p) => !p)}
                      aria-label={playing ? "Pause" : "Play"}
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          aria-pressed={speed === s}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-semibold tabular-nums transition-colors",
                            speed === s ? "bg-card text-foreground shadow-clay-sm" : "text-muted-foreground",
                          )}
                        >
                          {s}×
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                    <ToggleChip active={layers.routes} onClick={() => setLayers((l) => ({ ...l, routes: !l.routes }))} icon={RouteIcon} label="Routes" />
                    <ToggleChip active={layers.vehicles} onClick={() => setLayers((l) => ({ ...l, vehicles: !l.vehicles }))} icon={Zap} label="Shipments" />
                    <ToggleChip active={layers.risk} onClick={() => setLayers((l) => ({ ...l, risk: !l.risk }))} icon={ShieldAlert} label="Risk zones" />
                  </div>
                </div>

                {/* Legend + stats */}
                <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-2">
                  <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card/85 px-3 py-2 text-[11px] shadow-clay backdrop-blur">
                    {MODE_LEGEND.map((m) => (
                      <span key={m.mode} className="flex items-center gap-1.5 capitalize text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                        {m.mode}
                      </span>
                    ))}
                  </div>
                  <div className="pointer-events-auto flex items-center gap-4 rounded-xl border border-border bg-card/85 px-3 py-2 text-xs shadow-clay backdrop-blur">
                    <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> {model.routes.length} active</span>
                    <span className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5 text-secondary" /> {model.nodes.filter((n) => n.type === "warehouse").length} hubs</span>
                    <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-destructive" /> {risk.length} at risk</span>
                  </div>
                </div>

                {/* Inspector */}
                {selected && (
                  <div className="pointer-events-auto absolute right-4 top-20 w-64 rounded-xl border border-border bg-card/95 p-4 shadow-clay-lg backdrop-blur">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = MODE_ICON[selected.mode];
                          return <Icon className="h-4 w-4 text-primary" />;
                        })()}
                        <span className="font-mono text-sm font-semibold">{selected.shipmentRef}</span>
                      </div>
                      <button onClick={() => setSelected(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge status={selected.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Mode</span>
                        <span className="font-medium">{MODE_META[selected.mode].label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">From</span>
                        <span className="truncate font-medium">{selected.from.label.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">To</span>
                        <span className="truncate font-medium">{selected.to.label.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Health</span>
                        <span className="font-semibold tabular-nums">{selected.healthScore}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                      <Link href="/dashboard/shipments">Open in shipments</Link>
                    </Button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Basemap © OpenStreetMap contributors, © CARTO. Locations are derived deterministically from
        your records; grant location access via the map controls to center on your position.
      </p>
    </div>
  );
}

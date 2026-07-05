"use client";

import * as React from "react";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  Thermometer,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Layers,
  Gauge,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BarStat } from "@/components/charts";
import { getStore } from "@/services/store";
import { getWarehouseHeatmap } from "@/services/analytics";
import { formatCompact, formatNumber, cn } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";
import type { Warehouse, WarehouseZone } from "@/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const STATUS_META: Record<
  Warehouse["status"],
  { label: string; variant: Variant }
> = {
  operational: { label: "Operational", variant: "success" },
  high_load: { label: "High Load", variant: "warning" },
  maintenance: { label: "Maintenance", variant: "muted" },
};

const ZONE_META: Record<WarehouseZone["type"], { label: string; variant: Variant }> = {
  ambient: { label: "Ambient", variant: "secondary" },
  cold: { label: "Cold", variant: "default" },
  hazmat: { label: "Hazmat", variant: "destructive" },
  bonded: { label: "Bonded", variant: "accent" },
};

/** Utilization → indicator gradient class, by threshold. */
function utilizationIndicator(value: number): string {
  if (value >= 88) return "bg-gradient-to-r from-warning to-destructive";
  if (value >= 72) return "bg-gradient-to-r from-accent to-warning";
  return "bg-gradient-to-r from-primary to-accent";
}

/** Utilization → text color, by threshold. */
function utilizationText(value: number): string {
  if (value >= 88) return "text-destructive";
  if (value >= 72) return "text-warning";
  return "text-success";
}

/** Heatmap cell background — scales primary alpha with value. */
function heatBackground(value: number): string {
  const alpha = 0.08 + (value / 100) * 0.82;
  return `hsl(var(--primary) / ${alpha.toFixed(3)})`;
}

function heatText(value: number): string {
  return value >= 55 ? "text-primary-foreground" : "text-foreground";
}

interface KpiTile {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function WarehousesPage() {
  const { warehouses } = getStore();
  const heatmap = React.useMemo(() => getWarehouseHeatmap(), []);
  const heatByName = React.useMemo(() => {
    const map = new Map<string, number[]>();
    for (const h of heatmap) map.set(h.name, h.zones);
    return map;
  }, [heatmap]);

  const regions = React.useMemo(() => {
    return Array.from(new Set(warehouses.map((w) => w.region))).sort();
  }, [warehouses]);

  const [region, setRegion] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Warehouse | null>(null);

  const filtered = React.useMemo(
    () => (region === "all" ? warehouses : warehouses.filter((w) => w.region === region)),
    [warehouses, region],
  );

  const kpis: KpiTile[] = React.useMemo(() => {
    const totalCapacity = warehouses.reduce((a, w) => a + w.capacity, 0);
    const totalUsed = warehouses.reduce((a, w) => a + w.used, 0);
    const avgUtil = Math.round(
      warehouses.reduce((a, w) => a + w.utilization, 0) / warehouses.length,
    );
    const inbound = warehouses.reduce((a, w) => a + w.inboundToday, 0);
    const outbound = warehouses.reduce((a, w) => a + w.outboundToday, 0);
    return [
      {
        label: "Total Capacity",
        value: `${formatCompact(totalCapacity)} units`,
        sub: `${formatCompact(totalUsed)} occupied`,
        icon: Boxes,
      },
      {
        label: "Avg Utilization",
        value: `${avgUtil}%`,
        sub: `across ${warehouses.length} sites`,
        icon: Gauge,
      },
      {
        label: "Inbound Today",
        value: formatNumber(inbound),
        sub: "receiving shipments",
        icon: ArrowDownToLine,
      },
      {
        label: "Outbound Today",
        value: formatNumber(outbound),
        sub: "dispatched shipments",
        icon: ArrowUpFromLine,
      },
    ];
  }, [warehouses]);

  const flowData = React.useMemo(
    () =>
      warehouses.map((w) => ({
        label: w.name.split(" ")[0] ?? w.name,
        inbound: w.inboundToday,
        outbound: w.outboundToday,
      })),
    [warehouses],
  );

  const selectedZones = selected ? heatByName.get(selected.name) ?? [] : [];
  const selectedZoneData = selectedZones.map((v, i) => ({
    label: `Z${i + 1}`,
    intensity: v,
  }));

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Warehouses"
          description="Live capacity, throughput and zone-level utilization across your global fulfilment network."
        >
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[168px]" aria-label="Filter by region">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="gradient"
            onClick={() => toast.success("Add warehouse", { description: "Provisioning flow coming soon." })}
          >
            <Plus className="h-4 w-4" />
            Add warehouse
          </Button>
        </PageHeader>
      </FadeIn>

      {/* KPI row */}
      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <StaggerItem key={k.label}>
              <Card className="p-5 clay-interactive">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.sub}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="flow">Inbound/Outbound</TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------- Overview */}
        <TabsContent value="overview">
          {filtered.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No warehouses in this region.
            </Card>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((w) => {
                const status = STATUS_META[w.status];
                return (
                  <StaggerItem key={w.id}>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(w)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(w);
                        }
                      }}
                      className="flex h-full cursor-pointer flex-col p-5 clay-interactive"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-secondary shadow-clay-sm">
                            <WarehouseIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold leading-tight">{w.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {w.location}
                            </p>
                          </div>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline">{w.region}</Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Thermometer className="h-3 w-3" />
                          {w.temperatureC}°C
                        </span>
                      </div>

                      {/* Utilization */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Utilization</span>
                          <span className={cn("font-semibold", utilizationText(w.utilization))}>
                            {w.utilization}%
                          </span>
                        </div>
                        <Progress
                          value={w.utilization}
                          indicatorClassName={utilizationIndicator(w.utilization)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatCompact(w.used)} / {formatCompact(w.capacity)} units
                        </p>
                      </div>

                      {/* Stat strip */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                          <p className="text-sm font-semibold">{formatCompact(w.sku)}</p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            SKUs
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                          <p className="flex items-center justify-center gap-1 text-sm font-semibold text-success">
                            <ArrowDownToLine className="h-3 w-3" />
                            {w.inboundToday}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            In
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                          <p className="flex items-center justify-center gap-1 text-sm font-semibold text-accent">
                            <ArrowUpFromLine className="h-3 w-3" />
                            {w.outboundToday}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Out
                          </p>
                        </div>
                      </div>

                      {/* Mini zone breakdown */}
                      <div className="mt-4 space-y-2">
                        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          Zones
                        </p>
                        {w.zones.map((z) => (
                          <div key={z.id} className="flex items-center gap-2">
                            <span className="w-14 shrink-0 truncate text-xs">{z.name}</span>
                            <Badge variant={ZONE_META[z.type].variant} className="shrink-0">
                              {ZONE_META[z.type].label}
                            </Badge>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted shadow-clay-inset">
                              <div
                                className={cn("h-full rounded-full", utilizationIndicator(z.utilization))}
                                style={{ width: `${z.utilization}%` }}
                              />
                            </div>
                            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                              {z.utilization}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </TabsContent>

        {/* -------------------------------------------------- Heatmap */}
        <TabsContent value="heatmap">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Utilization Heatmap</CardTitle>
                <CardDescription>
                  Zone-level demand intensity across 8 monitored bays per site. Hover a cell
                  for its value.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <div className="min-w-[640px] space-y-2">
                    {/* header */}
                    <div className="flex items-center gap-2">
                      <span className="w-40 shrink-0 text-xs font-medium text-muted-foreground">
                        Site
                      </span>
                      <div className="grid flex-1 grid-cols-8 gap-2">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span
                            key={i}
                            className="text-center text-[10px] uppercase tracking-wide text-muted-foreground"
                          >
                            Z{i + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    {warehouses.map((w) => {
                      const zones = heatByName.get(w.name) ?? [];
                      return (
                        <div key={w.id} className="flex items-center gap-2">
                          <span className="w-40 shrink-0 truncate text-xs font-medium">
                            {w.name}
                          </span>
                          <div className="grid flex-1 grid-cols-8 gap-2">
                            {zones.map((v, i) => (
                              <div
                                key={i}
                                title={`${w.name} · Z${i + 1}: ${v}%`}
                                className={cn(
                                  "grid h-9 place-items-center rounded-lg text-[11px] font-semibold tabular-nums shadow-clay-sm transition-transform hover:scale-105",
                                  heatText(v),
                                )}
                                style={{ background: heatBackground(v) }}
                              >
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground">Low</span>
                  <div className="flex h-3 flex-1 overflow-hidden rounded-full shadow-clay-inset">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ background: heatBackground((i + 1) * 10) }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* -------------------------------------------------- Inbound/Outbound */}
        <TabsContent value="flow">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Inbound vs Outbound Today</CardTitle>
                <CardDescription>
                  Daily throughput balance per fulfilment site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarStat
                  data={flowData}
                  height={360}
                  series={[
                    { key: "inbound", label: "Inbound", color: "hsl(var(--success))" },
                    { key: "outbound", label: "Outbound", color: "hsl(var(--accent))" },
                  ]}
                />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------- Detail dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5 text-secondary" />
                  {selected.name}
                </DialogTitle>
                <DialogDescription>
                  {selected.location} · {selected.region} · {STATUS_META[selected.status].label}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Capacity", value: `${formatCompact(selected.capacity)}` },
                    { label: "Occupied", value: `${formatCompact(selected.used)}` },
                    { label: "SKUs", value: formatCompact(selected.sku) },
                    { label: "Temp", value: `${selected.temperatureC}°C` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center shadow-clay-inset">
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Layers className="h-4 w-4" />
                    Zone details
                  </p>
                  <div className="space-y-2">
                    {selected.zones.map((z) => (
                      <div key={z.id} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-sm">{z.name}</span>
                        <Badge variant={ZONE_META[z.type].variant} className="shrink-0">
                          {ZONE_META[z.type].label}
                        </Badge>
                        <Progress
                          value={z.utilization}
                          indicatorClassName={utilizationIndicator(z.utilization)}
                        />
                        <span className={cn("w-10 shrink-0 text-right text-sm font-semibold tabular-nums", utilizationText(z.utilization))}>
                          {z.utilization}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Package className="h-4 w-4" />
                    Bay intensity (8 zones)
                  </p>
                  <BarStat
                    data={selectedZoneData}
                    height={200}
                    series={[{ key: "intensity", label: "Intensity", color: "hsl(var(--primary))" }]}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

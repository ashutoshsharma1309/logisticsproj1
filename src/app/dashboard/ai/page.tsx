"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Route,
  Warehouse,
  TrendingUp,
  DollarSign,
  Leaf,
  Truck,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { useOrgData } from "@/hooks/use-org-data";
import { useCollection } from "@/hooks/use-collection";
import { shipmentCost, shipmentEmissions } from "@/lib/domain/calc";
import { warehouseUtilization } from "@/lib/analytics/compute";
import { MODE_META } from "@/config/status";
import { formatCurrency, formatCompact, formatNumber, cn } from "@/lib/utils";
import type { TransportMode } from "@/types";

type InsightCategory =
  | "delay"
  | "warehouse"
  | "cost"
  | "route"
  | "emissions"
  | "fleet";

interface Insight {
  id: string;
  category: InsightCategory;
  icon: LucideIcon;
  tint: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "alert" | "info";
}

interface Capability {
  name: string;
  icon: LucideIcon;
  tint: string;
  metric: string;
  caption: string;
}

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "delay", label: "Delays" },
  { value: "warehouse", label: "Warehouse" },
  { value: "cost", label: "Cost" },
  { value: "route", label: "Routes" },
  { value: "emissions", label: "Emissions" },
  { value: "fleet", label: "Fleet" },
];

export default function AiIntelligencePage() {
  const {
    shipments,
    warehouses,
    vehicles,
    currency,
    isEmpty,
  } = useOrgData();
  const ledger = useCollection("ledger").items;
  const [category, setCategory] = React.useState("all");

  // ---- Derived, honest metrics (no fabricated confidence scores) -----------
  const metrics = React.useMemo(() => {
    const delayed = shipments.filter(
      (s) => s.status === "delayed" || s.status === "exception",
    );
    const totalFreight = shipments.reduce(
      (a, s) => a + shipmentCost(s).total,
      0,
    );
    const totalDistance = shipments.reduce((a, s) => a + (s.distanceKm || 0), 0);
    const totalEmissions = shipments.reduce(
      (a, s) => a + shipmentEmissions(s),
      0,
    );
    const util = warehouseUtilization(warehouses);
    const overCapacity = util.filter((w) => w.pct > 90);
    const activeVehicles = vehicles.filter((v) => v.status === "active").length;
    const costPerKm = totalDistance > 0 ? totalFreight / totalDistance : 0;
    const avgCostPerShipment =
      shipments.length > 0 ? totalFreight / shipments.length : 0;

    // Highest-cost lane: origin warehouse → destination city.
    const laneMap = new Map<string, { label: string; total: number }>();
    for (const s of shipments) {
      const origin =
        warehouses.find((w) => w.id === s.originWarehouseId)?.name ??
        "Unknown origin";
      const dest = s.destinationCity || "Unknown";
      const key = `${origin}→${dest}`;
      const cur = laneMap.get(key) ?? { label: `${origin} → ${dest}`, total: 0 };
      cur.total += shipmentCost(s).total;
      laneMap.set(key, cur);
    }
    const topLane = [...laneMap.values()].sort((a, b) => b.total - a.total)[0];

    // Most-used mode.
    const modeMap = new Map<TransportMode, number>();
    for (const s of shipments)
      modeMap.set(s.mode, (modeMap.get(s.mode) ?? 0) + 1);
    const topMode = [...modeMap.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      delayed,
      totalEmissions,
      overCapacity,
      util,
      activeVehicles,
      costPerKm,
      avgCostPerShipment,
      topLane,
      topMode: topMode
        ? { mode: topMode[0], count: topMode[1] }
        : null,
    };
  }, [shipments, warehouses, vehicles]);

  // ---- Capability tiles (each backed by a real number) ---------------------
  const capabilities: Capability[] = React.useMemo(() => {
    const dash = (v: string, ok: boolean) => (ok ? v : "—");
    return [
      {
        name: "Delay Detection",
        icon: AlertTriangle,
        tint: "bg-warning/15 text-warning",
        metric: dash(String(metrics.delayed.length), shipments.length > 0),
        caption: "flagged shipments",
      },
      {
        name: "Route Cost Analysis",
        icon: Route,
        tint: "bg-primary/15 text-primary",
        metric: dash(
          metrics.topLane ? formatCurrency(metrics.topLane.total, currency) : "—",
          Boolean(metrics.topLane),
        ),
        caption: "top lane spend",
      },
      {
        name: "Warehouse Optimization",
        icon: Warehouse,
        tint: "bg-secondary/15 text-secondary",
        metric: dash(String(metrics.overCapacity.length), warehouses.length > 0),
        caption: "facilities > 90%",
      },
      {
        name: "Demand Signal",
        icon: TrendingUp,
        tint: "bg-accent/15 text-accent",
        metric: dash(
          metrics.topMode ? MODE_META[metrics.topMode.mode].label : "—",
          Boolean(metrics.topMode),
        ),
        caption: "leading mode",
      },
      {
        name: "Cost Efficiency",
        icon: DollarSign,
        tint: "bg-success/15 text-success",
        metric: dash(
          `${formatCurrency(metrics.costPerKm, currency)}`,
          metrics.costPerKm > 0,
        ),
        caption: "avg cost / km",
      },
      {
        name: "Emissions Tracking",
        icon: Leaf,
        tint: "bg-success/15 text-success",
        metric: dash(
          `${formatCompact(metrics.totalEmissions)} kg`,
          shipments.length > 0,
        ),
        caption: "total CO₂",
      },
      {
        name: "Fleet Readiness",
        icon: Truck,
        tint: "bg-primary/15 text-primary",
        metric: dash(
          `${metrics.activeVehicles}/${vehicles.length}`,
          vehicles.length > 0,
        ),
        caption: "active vehicles",
      },
      {
        name: "Data Integrity",
        icon: Fingerprint,
        tint: "bg-accent/15 text-accent",
        metric: dash(String(ledger.length), ledger.length > 0),
        caption: "ledger blocks",
      },
    ];
  }, [metrics, shipments.length, warehouses.length, vehicles.length, ledger.length, currency]);

  // ---- Insight feed (only from real conditions) ----------------------------
  const insights: Insight[] = React.useMemo(() => {
    const list: Insight[] = [];

    if (metrics.delayed.length > 0) {
      const refs = metrics.delayed
        .slice(0, 4)
        .map((s) => s.reference)
        .join(", ");
      list.push({
        id: "delayed",
        category: "delay",
        icon: AlertTriangle,
        tint: "bg-warning/15 text-warning",
        title: `${metrics.delayed.length} shipment${
          metrics.delayed.length === 1 ? "" : "s"
        } delayed or in exception`,
        description: `Needs attention: ${refs}${
          metrics.delayed.length > 4 ? " and more" : ""
        }.`,
        href: "/dashboard/shipments",
        cta: "Review shipments",
        tone: "alert",
      });
    }

    for (const w of metrics.overCapacity) {
      list.push({
        id: `wh-${w.name}`,
        category: "warehouse",
        icon: Warehouse,
        tint: "bg-secondary/15 text-secondary",
        title: `${w.name} at ${w.pct}% capacity`,
        description:
          "This facility is above 90% utilization — consider rebalancing inbound volume.",
        href: "/dashboard/warehouses",
        cta: "Open warehouses",
        tone: "alert",
      });
    }

    if (metrics.topLane) {
      list.push({
        id: "top-lane",
        category: "route",
        icon: Route,
        tint: "bg-primary/15 text-primary",
        title: `Highest-cost lane: ${metrics.topLane.label}`,
        description: `This route accounts for ${formatCurrency(
          metrics.topLane.total,
          currency,
        )} of total freight spend.`,
        href: "/dashboard/shipments",
        cta: "Inspect lane",
        tone: "info",
      });
    }

    if (metrics.topMode) {
      list.push({
        id: "top-mode",
        category: "fleet",
        icon: TrendingUp,
        tint: "bg-accent/15 text-accent",
        title: `Most-used mode: ${MODE_META[metrics.topMode.mode].label}`,
        description: `${metrics.topMode.count} of ${formatNumber(
          shipments.length,
        )} shipments move by ${MODE_META[
          metrics.topMode.mode
        ].label.toLowerCase()}.`,
        href: "/dashboard/analytics",
        cta: "View analytics",
        tone: "info",
      });
    }

    if (metrics.avgCostPerShipment > 0) {
      list.push({
        id: "avg-cost",
        category: "cost",
        icon: DollarSign,
        tint: "bg-success/15 text-success",
        title: `Average delivery cost: ${formatCurrency(
          metrics.avgCostPerShipment,
          currency,
        )} per shipment`,
        description:
          "Benchmark your quotes against this figure to protect margin on new lanes.",
        href: "/dashboard/analytics",
        cta: "See cost breakdown",
        tone: "info",
      });
    }

    if (metrics.totalEmissions > 0) {
      list.push({
        id: "emissions",
        category: "emissions",
        icon: Leaf,
        tint: "bg-success/15 text-success",
        title: `Estimated ${formatCompact(metrics.totalEmissions)} kg CO₂ across the network`,
        description:
          "Shifting eligible loads from air/road to rail or ocean is the fastest lever to cut this.",
        href: "/dashboard/analytics",
        cta: "Sustainability view",
        tone: "info",
      });
    }

    return list;
  }, [metrics, shipments.length, currency]);

  const filtered = insights.filter(
    (i) => category === "all" || i.category === category,
  );

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="AI Intelligence"
          description="Insights are computed from your live data by a transparent, rules-based engine — a heuristic layer that is pluggable for a real model as your dataset grows."
        />
      </FadeIn>

      {isEmpty ? (
        <FadeIn delay={0.05}>
          <Card className="p-2">
            <EmptyState
              icon={Sparkles}
              title="Insights appear as you add data"
              description="This engine reads your real shipments, warehouses, fleet and ledger. Create records to surface delay, cost, routing and emissions insights."
              action={
                <Button variant="gradient" asChild>
                  <Link href="/dashboard/shipments?new=1">
                    Create your first shipment
                  </Link>
                </Button>
              }
            />
          </Card>
        </FadeIn>
      ) : (
        <>
          {/* Capability tiles */}
          <FadeIn delay={0.05}>
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Capabilities
              </h2>
              <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {capabilities.map((c) => {
                  const Icon = c.icon;
                  return (
                    <StaggerItem key={c.name}>
                      <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
                        <div
                          className={cn(
                            "grid h-11 w-11 place-items-center rounded-xl shadow-clay-inset",
                            c.tint,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-3 font-semibold">{c.name}</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                          {c.metric}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.caption}
                        </p>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            </div>
          </FadeIn>

          {/* Insight feed */}
          <FadeIn delay={0.1}>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Insight Feed
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} insight
                    {filtered.length === 1 ? "" : "s"} derived from your data
                  </p>
                </div>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  className="w-[168px]"
                  aria-label="Filter insights by category"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <Card className="p-2">
                <EmptyState
                  icon={CheckCircle2}
                  title="No issues detected across your current data"
                  description={
                    category === "all"
                      ? "Everything looks healthy. New insights will appear automatically as conditions change."
                      : "Nothing notable in this category right now. Try a different filter."
                  }
                />
              </Card>
            ) : (
              <StaggerGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filtered.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <StaggerItem key={insight.id}>
                      <Card className="flex h-full flex-col p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-clay-inset",
                              insight.tint,
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{insight.title}</h3>
                              {insight.tone === "alert" && (
                                <Badge variant="warning">Action</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button size="sm" variant="clay" asChild>
                            <Link href={insight.href}>
                              {insight.cta}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            )}
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="text-center text-xs text-muted-foreground">
              These insights are heuristic (rules over your stored records), not
              black-box predictions. The engine is architected so a trained model
              can replace the rules without changing this page.
            </p>
          </FadeIn>
        </>
      )}
    </div>
  );
}

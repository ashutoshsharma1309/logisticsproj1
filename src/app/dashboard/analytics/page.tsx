"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  TrendingUp,
  Wallet,
  Leaf,
  Truck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { AreaTrend, BarStat, DonutChart } from "@/components/charts";
import {
  revenueTrend,
  deliveryTrend,
  modeSplit,
  statusSplit,
  costBreakdown,
  fleetStatusSplit,
  warehouseUtilization,
} from "@/lib/analytics/compute";
import { shipmentCost, shipmentEmissions } from "@/lib/domain/calc";
import { useOrgData } from "@/hooks/use-org-data";
import { MODE_META } from "@/config/status";
import { formatCurrency, formatCompact, formatNumber, cn } from "@/lib/utils";
import type { TimeSeriesPoint, TransportMode } from "@/types";

/** Muted placeholder shown inside a chart card when there is no data yet. */
function NoData({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-2xl bg-muted/40 text-sm text-muted-foreground shadow-clay-inset">
      {label} — add records to see this chart
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{empty ? <NoData /> : children}</CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const {
    shipments,
    warehouses,
    vehicles,
    currency,
    stats,
    isEmpty,
  } = useOrgData();

  const hasShipments = shipments.length > 0;

  // Derived series — all computed from stored records.
  const delivery = React.useMemo(() => deliveryTrend(shipments), [shipments]);
  const status = React.useMemo(() => statusSplit(shipments), [shipments]);
  const modes = React.useMemo(() => modeSplit(shipments), [shipments]);
  const revenue = React.useMemo(() => revenueTrend(shipments), [shipments]);
  const costs = React.useMemo(() => costBreakdown(shipments), [shipments]);
  const fleet = React.useMemo(() => fleetStatusSplit(vehicles), [vehicles]);
  const warehouseRows = React.useMemo(
    () => warehouseUtilization(warehouses),
    [warehouses],
  );
  const warehouseBars: TimeSeriesPoint[] = React.useMemo(
    () => warehouseRows.map((w) => ({ label: w.name, value: w.pct })),
    [warehouseRows],
  );

  // Sustainability — total CO₂ and per-mode split, derived from calc.
  const emissions = React.useMemo(() => {
    let total = 0;
    const byMode = new Map<TransportMode, number>();
    for (const s of shipments) {
      const e = shipmentEmissions(s);
      total += e;
      byMode.set(s.mode, (byMode.get(s.mode) ?? 0) + e);
    }
    const perMode: TimeSeriesPoint[] = (
      ["truck", "ship", "plane", "rail"] as const
    )
      .map((mode) => ({
        label: MODE_META[mode].label,
        value: Math.round(byMode.get(mode) ?? 0),
      }))
      .filter((d) => d.value > 0);
    return { total: Math.round(total), perMode };
  }, [shipments]);

  function handleExport() {
    if (!hasShipments) {
      toast.error("Nothing to export", {
        description: "Create shipments first to generate a report.",
      });
      return;
    }
    const header = ["reference", "status", "mode", "weightKg", "distanceKm", "total"];
    const escape = (v: string | number) => {
      const str = String(v);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const rows = shipments.map((s) =>
      [
        s.reference,
        s.status,
        s.mode,
        s.weightKg,
        s.distanceKm,
        shipmentCost(s).total,
      ]
        .map(escape)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chainroute-analytics-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Report exported", {
      description: `${shipments.length} shipment${
        shipments.length === 1 ? "" : "s"
      } written to CSV.`,
    });
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Analytics"
          description="Every chart and figure below is computed live from your stored shipments, fleet and warehouses."
        >
          <Button variant="gradient" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </PageHeader>
      </FadeIn>

      {/* KPI strip — StatCard renders "—" when a metric is empty. */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.slice(0, 8).map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </FadeIn>

      {isEmpty ? (
        <FadeIn delay={0.1}>
          <Card className="p-2">
            <EmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Analytics are calculated automatically from your shipments, fleet and warehouses. Create records to see insights."
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
        <FadeIn delay={0.1}>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="flex-wrap">
              <TabsTrigger value="performance">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="cost">
                <Wallet className="h-4 w-4" />
                Cost &amp; Revenue
              </TabsTrigger>
              <TabsTrigger value="sustainability">
                <Leaf className="h-4 w-4" />
                Sustainability
              </TabsTrigger>
              <TabsTrigger value="fleet">
                <Truck className="h-4 w-4" />
                Fleet &amp; Warehouse
              </TabsTrigger>
            </TabsList>

            {/* PERFORMANCE */}
            <TabsContent value="performance" className="space-y-6">
              <ChartCard
                title="Delivery Trend"
                description="Delivered vs delayed shipments by month."
                icon={TrendingUp}
                empty={delivery.length === 0}
              >
                <AreaTrend
                  data={delivery}
                  height={320}
                  series={[
                    {
                      key: "delivered",
                      label: "Delivered",
                      color: "hsl(var(--success))",
                    },
                    {
                      key: "delayed",
                      label: "Delayed",
                      color: "hsl(var(--warning))",
                    },
                  ]}
                />
              </ChartCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Status Distribution"
                  description="Shipments by lifecycle stage."
                  empty={status.length === 0}
                >
                  <DonutChart data={status} />
                </ChartCard>
                <ChartCard
                  title="Mode Split"
                  description="Shipments by transport mode."
                  empty={modes.length === 0}
                >
                  <DonutChart data={modes} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* COST & REVENUE */}
            <TabsContent value="cost" className="space-y-6">
              <ChartCard
                title="Revenue vs Cost"
                description="Total shipment value against operating cost by month."
                icon={Wallet}
                empty={revenue.length === 0}
              >
                <BarStat
                  data={revenue}
                  height={320}
                  series={[
                    {
                      key: "revenue",
                      label: "Revenue",
                      color: "hsl(var(--primary))",
                    },
                    {
                      key: "cost",
                      label: "Cost",
                      color: "hsl(var(--secondary))",
                    },
                  ]}
                />
              </ChartCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Cost Breakdown"
                  description="Where your freight spend goes."
                  empty={costs.length === 0}
                >
                  <DonutChart data={costs} />
                </ChartCard>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Components</CardTitle>
                    <CardDescription>
                      Aggregated across {formatNumber(shipments.length)} shipment
                      {shipments.length === 1 ? "" : "s"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {costs.length === 0 ? (
                      <NoData />
                    ) : (
                      <ul className="space-y-2.5">
                        {costs.map((c) => (
                          <li
                            key={c.label}
                            className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 shadow-clay-inset"
                          >
                            <span className="text-sm font-medium">{c.label}</span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(Number(c.value), currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SUSTAINABILITY */}
            <TabsContent value="sustainability" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/12 text-success shadow-clay-inset">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Total CO₂</CardTitle>
                        <CardDescription>Estimated emissions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold tracking-tight text-success">
                      {hasShipments ? formatCompact(emissions.total) : "—"}
                      {hasShipments && (
                        <span className="ml-1 text-lg font-semibold text-muted-foreground">
                          kg
                        </span>
                      )}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Derived from weight × distance × mode emission factor for
                      each shipment. Not a certified figure — a planning estimate.
                    </p>
                  </CardContent>
                </Card>

                <ChartCard
                  title="Emissions by Mode"
                  description="CO₂ (kg) contributed per transport mode."
                  empty={emissions.perMode.length === 0}
                >
                  <BarStat
                    data={emissions.perMode}
                    height={240}
                    series={[
                      {
                        key: "value",
                        label: "CO₂ (kg)",
                        color: "hsl(var(--success))",
                      },
                    ]}
                  />
                </ChartCard>
              </div>
            </TabsContent>

            {/* FLEET & WAREHOUSE */}
            <TabsContent value="fleet" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Fleet Status"
                  description="Vehicles by operational status."
                  icon={Truck}
                  empty={fleet.length === 0}
                >
                  <DonutChart data={fleet} />
                </ChartCard>

                <ChartCard
                  title="Warehouse Utilization"
                  description="Used capacity as a percentage per facility."
                  empty={warehouseBars.length === 0}
                >
                  <BarStat
                    data={warehouseBars}
                    height={260}
                    series={[
                      {
                        key: "value",
                        label: "Utilization %",
                        color: "hsl(var(--accent))",
                      },
                    ]}
                  />
                </ChartCard>
              </div>

              {warehouseRows.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Capacity Detail</CardTitle>
                    <CardDescription>
                      Used vs total units per warehouse.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {warehouseRows.map((w) => (
                      <div key={w.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{w.name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatNumber(w.used)}/{formatNumber(w.capacity)} ·{" "}
                            {w.pct}%
                          </span>
                        </div>
                        <div
                          className="h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-clay-inset"
                          role="progressbar"
                          aria-valuenow={w.pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${w.name} utilization`}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              w.pct >= 90
                                ? "bg-gradient-to-r from-warning to-destructive"
                                : "bg-gradient-to-r from-primary to-accent",
                            )}
                            style={{ width: `${Math.min(100, w.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </FadeIn>
      )}
    </div>
  );
}

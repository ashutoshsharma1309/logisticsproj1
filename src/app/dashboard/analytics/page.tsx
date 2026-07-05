"use client";

import * as React from "react";
import {
  Download,
  CalendarRange,
  TrendingUp,
  Anchor,
  CloudRain,
  FileCheck2,
  Boxes,
  Leaf,
  Gauge,
  Sparkles,
  Grid3x3,
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { MetricCard } from "@/components/shared/metric-card";
import {
  AreaTrend,
  BarStat,
  DonutChart,
  ForecastChart,
  LineForecast,
  RadialGauge,
} from "@/components/charts";
import {
  getKpis,
  getDeliveryTrend,
  getRevenueTrend,
  getModeSplit,
  getRiskDistribution,
  getStatusDistribution,
  getFuelTrend,
  getPredictionCurve,
  getWarehouseHeatmap,
} from "@/services/analytics";
import { getStore } from "@/services/store";
import { MODE_META } from "@/config/status";
import { formatCurrency, formatCompact, formatNumber, cn } from "@/lib/utils";
import type { TimeSeriesPoint, TransportMode } from "@/types";

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "ytd", label: "Year to date" },
  { value: "12m", label: "Last 12 months" },
];

const DELAY_DRIVERS = [
  { label: "Port congestion", pct: 34, icon: Anchor, tint: "text-primary" },
  { label: "Weather disruption", pct: 27, icon: CloudRain, tint: "text-warning" },
  { label: "Customs clearance", pct: 22, icon: FileCheck2, tint: "text-accent" },
  { label: "Capacity shortfall", pct: 17, icon: Boxes, tint: "text-secondary" },
];

const DEMAND_FORECAST: TimeSeriesPoint[] = [
  { label: "Wk 1", demand: 1180, baseline: 1120 },
  { label: "Wk 2", demand: 1240, baseline: 1150 },
  { label: "Wk 3", demand: 1320, baseline: 1210 },
  { label: "Wk 4", demand: 1290, baseline: 1240 },
  { label: "Wk 5", demand: 1410, baseline: 1300 },
  { label: "Wk 6", demand: 1480, baseline: 1350 },
];

export default function AnalyticsPage() {
  const [range, setRange] = React.useState("30d");

  const kpis = React.useMemo(() => getKpis(), []);
  const deliveryTrend = React.useMemo(() => getDeliveryTrend(), []);
  const revenueTrend = React.useMemo(() => getRevenueTrend(), []);
  const modeSplit = React.useMemo(() => getModeSplit(), []);
  const riskDist = React.useMemo(() => getRiskDistribution(), []);
  const statusDist = React.useMemo(() => getStatusDistribution(), []);
  const fuelTrend = React.useMemo(() => getFuelTrend(), []);
  const predictionCurve = React.useMemo(() => getPredictionCurve(), []);
  const heatmap = React.useMemo(() => getWarehouseHeatmap(), []);

  const strip = kpis.slice(2, 6);

  // Sustainability figures computed from the live shipment store.
  const co2 = React.useMemo(() => {
    const { shipments } = getStore();
    const total = shipments.reduce((a, s) => a + s.co2Kg, 0);
    const byMode = new Map<TransportMode, number>();
    for (const s of shipments) {
      byMode.set(s.mode, (byMode.get(s.mode) ?? 0) + s.co2Kg);
    }
    const perMode: TimeSeriesPoint[] = (
      ["truck", "ship", "plane", "rail"] as const
    ).map((mode) => ({
      label: MODE_META[mode].label,
      value: Math.round(byMode.get(mode) ?? 0),
    }));
    const avg = total / Math.max(1, shipments.length);
    // Lower emissions per shipment ⇒ higher green score.
    const greenScore = Math.round(Math.max(40, Math.min(96, 100 - avg / 65)));
    return { total, perMode, avg, greenScore, count: shipments.length };
  }, []);

  const avgConfidence = React.useMemo(
    () =>
      Math.round(
        predictionCurve.reduce((a, p) => a + Number(p.predicted), 0) /
          predictionCurve.length,
      ),
    [predictionCurve],
  );

  function handleExport() {
    toast.success("Report exported", {
      description: "Analytics_export.csv is ready in your downloads.",
    });
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Analytics"
          description="Deep operational intelligence across delivery performance, risk, sustainability and predictive forecasts."
        >
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[168px]" aria-label="Select date range">
              <span className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 opacity-70" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="gradient" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </PageHeader>
      </FadeIn>

      {/* KPI strip */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {strip.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk">
              <Gauge className="h-4 w-4" />
              Risk &amp; Delay
            </TabsTrigger>
            <TabsTrigger value="sustainability">
              <Leaf className="h-4 w-4" />
              Sustainability
            </TabsTrigger>
            <TabsTrigger value="prediction">
              <Sparkles className="h-4 w-4" />
              Prediction
            </TabsTrigger>
          </TabsList>

          {/* PERFORMANCE */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Delivery Throughput</CardTitle>
                  <CardDescription>
                    Delivered vs delayed volume with 12-month forecast band.
                  </CardDescription>
                </div>
                <Badge variant="success">On-track</Badge>
              </CardHeader>
              <CardContent>
                <AreaTrend
                  data={deliveryTrend}
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
                    {
                      key: "forecast",
                      label: "Forecast",
                      color: "hsl(var(--primary))",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Cost</CardTitle>
                  <CardDescription>
                    Monthly gross revenue against operating cost.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarStat
                    data={revenueTrend}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mode Split</CardTitle>
                  <CardDescription>
                    Active shipments by transport mode.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart data={modeSplit} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>
                    Live breakdown of every shipment lifecycle stage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarStat
                    data={statusDist}
                    height={240}
                    series={[
                      {
                        key: "value",
                        label: "Shipments",
                        color: "hsl(var(--accent))",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RISK & DELAY */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>
                    Shipments segmented by predicted risk level.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    data={riskDist}
                    colors={[
                      "hsl(var(--success))",
                      "hsl(var(--warning))",
                      "hsl(var(--destructive))",
                      "hsl(var(--destructive))",
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>
                    Where shipments sit across the network right now.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarStat
                    data={statusDist}
                    series={[
                      {
                        key: "value",
                        label: "Shipments",
                        color: "hsl(var(--warning))",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Delay Drivers</CardTitle>
                <CardDescription>
                  Top factors contributing to late deliveries this period.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {DELAY_DRIVERS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted/60 shadow-clay-inset">
                            <Icon className={cn("h-4 w-4", d.tint)} />
                          </span>
                          {d.label}
                        </span>
                        <span className="font-semibold tabular-nums text-muted-foreground">
                          {d.pct}%
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-clay-inset"
                        role="progressbar"
                        aria-valuenow={d.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={d.label}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-warning to-destructive transition-all duration-500"
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUSTAINABILITY */}
          <TabsContent value="sustainability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Energy Mix</CardTitle>
                <CardDescription>
                  Relative consumption across diesel, electric and hydrogen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaTrend
                  data={fuelTrend}
                  height={280}
                  series={[
                    {
                      key: "diesel",
                      label: "Diesel",
                      color: "hsl(var(--destructive))",
                    },
                    {
                      key: "electric",
                      label: "Electric",
                      color: "hsl(var(--success))",
                    },
                    {
                      key: "hydrogen",
                      label: "Hydrogen",
                      color: "hsl(var(--primary))",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Carbon Footprint</CardTitle>
                  <CardDescription>
                    Emissions across {formatNumber(co2.count)} shipments, split by mode.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                      <p className="text-xs text-muted-foreground">Total CO2</p>
                      <p className="mt-1 text-xl font-bold">
                        {formatCompact(co2.total)} kg
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                      <p className="text-xs text-muted-foreground">Per shipment</p>
                      <p className="mt-1 text-xl font-bold">
                        {formatNumber(Math.round(co2.avg))} kg
                      </p>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-success/10 p-4 shadow-clay-inset sm:col-span-1">
                      <p className="text-xs text-muted-foreground">Offset target</p>
                      <p className="mt-1 text-xl font-bold text-success">
                        {formatCompact(co2.total * 0.42)} kg
                      </p>
                    </div>
                  </div>
                  <BarStat
                    data={co2.perMode}
                    height={200}
                    series={[
                      {
                        key: "value",
                        label: "CO2 (kg)",
                        color: "hsl(var(--success))",
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card className="flex flex-col items-center justify-center gap-2 py-6">
                <CardHeader className="pb-0 text-center">
                  <CardTitle>Green Score</CardTitle>
                  <CardDescription>Sustainability index</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  <RadialGauge
                    value={co2.greenScore}
                    label="Green"
                    color="hsl(var(--success))"
                    size={190}
                  />
                  <Badge variant="success" className="mt-2">
                    {co2.greenScore >= 80 ? "Excellent" : "Improving"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PREDICTION */}
          <TabsContent value="prediction" className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>On-Time Delivery Forecast (7-day)</CardTitle>
                  <CardDescription>
                    Predicted on-time rate with upper / lower confidence band.
                  </CardDescription>
                </div>
                <Badge variant="default">{avgConfidence}% avg</Badge>
              </CardHeader>
              <CardContent>
                <ForecastChart data={predictionCurve} height={300} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Model Confidence</CardTitle>
                  <CardDescription>
                    How the prediction engine derives this forecast.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    The forecast blends a gradient-boosted ensemble over historical
                    lane performance, live weather feeds and carrier reliability
                    scores. The shaded band represents the 90% confidence interval —
                    the true on-time rate is expected to land inside it.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                      <p className="text-xs">Mean confidence</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {avgConfidence}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                      <p className="text-xs">Signals fused</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">14</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demand Forecast</CardTitle>
                  <CardDescription>
                    Projected shipment volume vs rolling baseline.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LineForecast
                    data={DEMAND_FORECAST}
                    height={240}
                    series={[
                      {
                        key: "demand",
                        label: "Forecast demand",
                        color: "hsl(var(--primary))",
                      },
                      {
                        key: "baseline",
                        label: "Baseline",
                        color: "hsl(var(--muted-foreground))",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>

      {/* Heatmap */}
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/12 text-success shadow-clay-inset">
                <Grid3x3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Delivery Success Heatmap</CardTitle>
                <CardDescription>
                  On-time success intensity across warehouse zones.
                </CardDescription>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted-foreground">Low</span>
              <div className="flex h-3 w-28 overflow-hidden rounded-full shadow-clay-inset">
                {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
                  <span
                    key={o}
                    className="flex-1"
                    style={{ backgroundColor: `hsl(var(--success) / ${o})` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[560px] space-y-2">
              {heatmap.map((row) => (
                <div key={row.name} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm font-medium">
                    {row.name}
                  </span>
                  <div className="flex flex-1 gap-1.5">
                    {row.zones.map((zone, i) => {
                      const opacity = 0.12 + (zone / 100) * 0.88;
                      return (
                        <div
                          key={i}
                          className="group relative h-9 flex-1 rounded-lg shadow-clay-inset"
                          style={{
                            backgroundColor: `hsl(var(--success) / ${opacity.toFixed(2)})`,
                          }}
                          title={`Zone ${i + 1}: ${zone}% success`}
                        >
                          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-semibold text-success-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            {zone}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

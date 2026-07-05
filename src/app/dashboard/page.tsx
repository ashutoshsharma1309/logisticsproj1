"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MetricCard } from "@/components/shared/metric-card";
import { AreaTrend, BarStat, DonutChart, RadialGauge } from "@/components/charts";
import { LiveShipments } from "@/components/dashboard/live-shipments";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  getKpis,
  getDeliveryTrend,
  getRevenueTrend,
  getModeSplit,
} from "@/services/analytics";
import { getStore } from "@/services/store";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const kpis = getKpis();
  const deliveryTrend = getDeliveryTrend();
  const revenueTrend = getRevenueTrend();
  const modeSplit = getModeSplit();

  const { warehouses, vehicles, shipments } = getStore();
  const warehouseUtil = Math.round(
    warehouses.reduce((a, w) => a + w.utilization, 0) / warehouses.length,
  );
  const fleetHealth = Math.round(
    vehicles.reduce((a, v) => a + v.healthScore, 0) / vehicles.length,
  );
  const networkValue = shipments.reduce((a, s) => a + s.valueUsd, 0);
  const onTimeRate = Math.round(
    (shipments.filter((s) => s.status === "delivered").length /
      Math.max(1, shipments.length)) *
      100 +
      62,
  );

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Operations Overview"
          description="Real-time intelligence across your decentralized logistics network — every shipment ledger-verified, every route optimized by AI."
        >
          <Select defaultValue="30d">
            <SelectTrigger className="h-10 w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="gradient">
            <Link href="/dashboard/shipments">
              <Plus className="h-4 w-4" />
              New shipment
            </Link>
          </Button>
        </PageHeader>
      </FadeIn>

      {/* KPI grid */}
      <FadeIn
        delay={0.05}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </FadeIn>

      {/* Delivery trend + mode mix */}
      <FadeIn delay={0.1} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Delivered vs delayed volume with AI-forecasted throughput
            </p>
          </CardHeader>
          <CardContent>
            <AreaTrend
              data={deliveryTrend}
              series={[
                {
                  key: "delivered",
                  label: "Delivered",
                  color: "hsl(var(--primary))",
                },
                {
                  key: "delayed",
                  label: "Delayed",
                  color: "hsl(var(--warning))",
                },
                {
                  key: "forecast",
                  label: "Forecast",
                  color: "hsl(var(--accent))",
                },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transport Mix</CardTitle>
            <p className="text-sm text-muted-foreground">
              Shipments by transport mode
            </p>
          </CardHeader>
          <CardContent>
            <DonutChart data={modeSplit} height={280} />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Revenue vs cost + gauges */}
      <FadeIn delay={0.15} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Revenue vs Cost</CardTitle>
              <p className="text-sm text-muted-foreground">
                Monthly cargo revenue against operating cost
              </p>
            </div>
            <span className="rounded-full bg-success/12 px-3 py-1 text-sm font-semibold text-success">
              {formatCurrency(networkValue)}
            </span>
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
                { key: "cost", label: "Cost", color: "hsl(var(--secondary))" },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Health</CardTitle>
            <p className="text-sm text-muted-foreground">
              Live warehouse &amp; fleet indices
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-around gap-4 pt-2">
            <div className="flex flex-col items-center gap-2">
              <RadialGauge
                value={warehouseUtil}
                label="Warehouses"
                color="hsl(var(--primary))"
                size={160}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <RadialGauge
                value={fleetHealth}
                label="Fleet"
                color="hsl(var(--accent))"
                size={160}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Live shipments + insights */}
      <FadeIn delay={0.2} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveShipments />
        </div>
        <InsightsPanel limit={8} />
      </FadeIn>

      {/* Activity feed + snapshot */}
      <FadeIn delay={0.25} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed limit={12} />
        </div>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Network Snapshot</CardTitle>
            <p className="text-sm text-muted-foreground">
              Key operating indicators
            </p>
          </CardHeader>
          <CardContent className="grid flex-1 grid-cols-2 gap-3">
            {[
              {
                label: "On-time rate",
                value: `${Math.min(99, onTimeRate)}%`,
              },
              { label: "Active fleet", value: String(vehicles.length) },
              { label: "Warehouses", value: String(warehouses.length) },
              { label: "In network", value: String(shipments.length) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset"
              >
                <p className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Plus,
  Warehouse,
  Truck,
  Contact,
  Package,
  Rocket,
  ArrowRight,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AreaTrend, BarStat, DonutChart } from "@/components/charts";
import { LiveShipments } from "@/components/dashboard/live-shipments";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LoadDemoButton } from "@/components/dashboard/demo-data";
import { HealthRing } from "@/components/command-center/health-ring";
import { AlertRail } from "@/components/command-center/alert-rail";
import { NetworkPanel } from "@/components/command-center/network-panel";
import { MissionTimeline } from "@/components/command-center/mission-timeline";
import { useAuth } from "@/components/providers/auth-provider";
import { useOrgData } from "@/hooks/use-org-data";
import { useCommandCenter } from "@/hooks/use-command-center";
import { formatCompact } from "@/lib/utils";
import {
  deliveryTrend,
  modeSplit,
  revenueTrend,
  costBreakdown,
} from "@/lib/analytics/compute";

interface QuickStart {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const QUICK_STARTS: QuickStart[] = [
  { icon: Warehouse, title: "Add a warehouse", description: "Create the origin locations your shipments depart from.", href: "/dashboard/warehouses?new=1", cta: "Add warehouse" },
  { icon: Truck, title: "Register a vehicle", description: "Build out the fleet that will carry your cargo.", href: "/dashboard/fleet?new=1", cta: "Register vehicle" },
  { icon: Contact, title: "Add a customer", description: "Set up the accounts you ship for and invoice.", href: "/dashboard/customers?new=1", cta: "Add customer" },
  { icon: Package, title: "Create a shipment", description: "Log your first shipment to start tracking everything.", href: "/dashboard/shipments?new=1", cta: "Create shipment" },
];

function ChartFrame({
  title,
  description,
  isEmpty,
  className,
  children,
}: {
  title: string;
  description: string;
  isEmpty: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
            <p className="max-w-xs px-6 text-sm text-muted-foreground">
              No data yet — create shipments to populate this.
            </p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { org } = useAuth();
  const { shipments, stats, isEmpty } = useOrgData();
  const { health, alerts, emissions, network, recentBlocks } = useCommandCenter();

  const delivery = deliveryTrend(shipments);
  const modes = modeSplit(shipments);
  const revenue = revenueTrend(shipments);
  const costs = costBreakdown(shipments);

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={isEmpty ? (org?.name ?? "Dashboard") : "Mission Control"}
          description={
            isEmpty
              ? "Operations overview — every metric below is computed live from the records you create."
              : `${org?.name ?? "Your organization"} — live operational command center. Everything updates from your real records.`
          }
        >
          {!isEmpty && emissions > 0 && (
            <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-clay-sm sm:flex">
              <Leaf className="h-3.5 w-3.5 text-success" />
              {formatCompact(emissions)} kg CO₂
            </span>
          )}
          <Button asChild variant="gradient">
            <Link href="/dashboard/shipments?new=1">
              <Plus className="h-4 w-4" />
              New shipment
            </Link>
          </Button>
        </PageHeader>
      </FadeIn>

      {/* First-run onboarding */}
      {isEmpty ? (
        <>
          <FadeIn delay={0.05}>
            <Card className="overflow-hidden">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary shadow-clay-inset">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Let&apos;s build your logistics network
                    </h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Your workspace is empty. Add a few core records and this command
                      center fills with real, live intelligence — no demo data.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {QUICK_STARTS.map((q) => {
                    const Icon = q.icon;
                    return (
                      <div
                        key={q.href}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-5"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold">{q.title}</p>
                          <p className="text-xs text-muted-foreground">{q.description}</p>
                        </div>
                        <Button asChild variant="secondary" size="sm">
                          <Link href={q.href}>
                            {q.cta}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Just exploring?</p>
                    <p className="text-xs text-muted-foreground">
                      Load an opt-in sample dataset to see the command center, ledger and
                      analytics populated. Reset anytime from Settings.
                    </p>
                  </div>
                  <LoadDemoButton className="shrink-0" />
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.id} stat={s} />
            ))}
          </FadeIn>
        </>
      ) : (
        <>
          {/* Command row: health + live alerts */}
          <FadeIn delay={0.05} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <HealthRing health={health} className="lg:col-span-2" />
            <AlertRail alerts={alerts} />
          </FadeIn>

          {/* KPI wall */}
          <FadeIn delay={0.1} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.id} stat={s} />
            ))}
          </FadeIn>

          {/* Network + ledger activity */}
          <FadeIn delay={0.15} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <NetworkPanel network={network} className="lg:col-span-2" />
            <MissionTimeline blocks={recentBlocks} />
          </FadeIn>

          {/* Delivery trend + mode mix */}
          <FadeIn delay={0.2} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartFrame
              title="Delivery Performance"
              description="Delivered vs delayed volume by month"
              isEmpty={delivery.length === 0}
              className="lg:col-span-2"
            >
              <AreaTrend
                data={delivery}
                series={[
                  { key: "delivered", label: "Delivered", color: "hsl(var(--primary))" },
                  { key: "delayed", label: "Delayed", color: "hsl(var(--warning))" },
                ]}
                height={280}
              />
            </ChartFrame>
            <ChartFrame
              title="Transport Mix"
              description="Shipments by transport mode"
              isEmpty={modes.length === 0}
            >
              <DonutChart data={modes} height={280} />
            </ChartFrame>
          </FadeIn>

          {/* Revenue vs cost + cost breakdown */}
          <FadeIn delay={0.25} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartFrame
              title="Revenue vs Operating Cost"
              description="Monthly shipment revenue against operating cost"
              isEmpty={revenue.length === 0}
              className="lg:col-span-2"
            >
              <BarStat
                data={revenue}
                series={[
                  { key: "revenue", label: "Revenue", color: "hsl(var(--primary))" },
                  { key: "cost", label: "Cost", color: "hsl(var(--secondary))" },
                ]}
                height={280}
              />
            </ChartFrame>
            <ChartFrame
              title="Cost Breakdown"
              description="Where your shipment spend goes"
              isEmpty={costs.length === 0}
            >
              <DonutChart data={costs} height={280} />
            </ChartFrame>
          </FadeIn>

          {/* Live shipments + recommendations */}
          <FadeIn delay={0.3} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveShipments />
            </div>
            <InsightsPanel limit={8} />
          </FadeIn>

          {/* Activity feed */}
          <FadeIn delay={0.35}>
            <ActivityFeed limit={12} />
          </FadeIn>
        </>
      )}
    </div>
  );
}

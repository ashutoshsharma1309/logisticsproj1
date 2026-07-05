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
import { useAuth } from "@/components/providers/auth-provider";
import { useOrgData } from "@/hooks/use-org-data";
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
  {
    icon: Warehouse,
    title: "Add a warehouse",
    description: "Create the origin locations your shipments depart from.",
    href: "/dashboard/warehouses?new=1",
    cta: "Add warehouse",
  },
  {
    icon: Truck,
    title: "Register a vehicle",
    description: "Build out the fleet that will carry your cargo.",
    href: "/dashboard/fleet?new=1",
    cta: "Register vehicle",
  },
  {
    icon: Contact,
    title: "Add a customer",
    description: "Set up the accounts you ship for and invoice.",
    href: "/dashboard/customers?new=1",
    cta: "Add customer",
  },
  {
    icon: Package,
    title: "Create a shipment",
    description: "Log your first shipment to start tracking everything.",
    href: "/dashboard/shipments?new=1",
    cta: "Create shipment",
  },
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
          <div className="flex h-[280px] items-center justify-center rounded-2xl bg-muted/30 text-center shadow-clay-inset">
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

  const delivery = deliveryTrend(shipments);
  const modes = modeSplit(shipments);
  const revenue = revenueTrend(shipments);
  const costs = costBreakdown(shipments);

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={org?.name ?? "Dashboard"}
          description="Operations overview — every metric below is computed live from the records you create."
        >
          <Button asChild variant="gradient">
            <Link href="/dashboard/shipments?new=1">
              <Plus className="h-4 w-4" />
              New shipment
            </Link>
          </Button>
        </PageHeader>
      </FadeIn>

      {/* First-run onboarding */}
      {isEmpty && (
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
                    Your workspace is empty. Add a few core records and this
                    dashboard fills with real, live analytics — no demo data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_STARTS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div
                      key={q.href}
                      className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-5 shadow-clay-inset"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{q.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.description}
                        </p>
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

              <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Just exploring?</p>
                  <p className="text-xs text-muted-foreground">
                    Load an opt-in sample dataset to see the dashboard, ledger and analytics
                    populated. Reset anytime from Settings.
                  </p>
                </div>
                <LoadDemoButton className="shrink-0" />
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* KPI grid */}
      <FadeIn
        delay={0.1}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.id} stat={s} />
        ))}
      </FadeIn>

      {/* Delivery trend + mode mix */}
      <FadeIn delay={0.15} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
      <FadeIn delay={0.2} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
      <FadeIn delay={0.25} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveShipments />
        </div>
        <InsightsPanel limit={8} />
      </FadeIn>

      {/* Activity feed */}
      <FadeIn delay={0.3}>
        <ActivityFeed limit={12} />
      </FadeIn>
    </div>
  );
}

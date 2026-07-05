"use client";

import Link from "next/link";
import {
  Warehouse,
  Truck,
  Contact,
  Package,
  Gauge,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrgData } from "@/hooks/use-org-data";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

export function InsightsPanel({ limit }: { limit?: number }) {
  const { shipments, warehouses, vehicles, customers } = useOrgData();

  const recs: Recommendation[] = [];

  if (warehouses.length === 0) {
    recs.push({
      id: "add-warehouse",
      icon: Warehouse,
      tint: "bg-primary/15 text-primary",
      title: "Add your first warehouse",
      body: "Set up an origin location before you route shipments.",
      href: "/dashboard/warehouses?new=1",
      cta: "Add warehouse",
    });
  }
  if (vehicles.length === 0) {
    recs.push({
      id: "add-vehicle",
      icon: Truck,
      tint: "bg-secondary/15 text-secondary",
      title: "Register a vehicle",
      body: "Build your fleet so shipments can be assigned transport.",
      href: "/dashboard/fleet?new=1",
      cta: "Register vehicle",
    });
  }
  if (customers.length === 0) {
    recs.push({
      id: "add-customer",
      icon: Contact,
      tint: "bg-accent/15 text-accent",
      title: "Add a customer",
      body: "Create a customer account to attach shipments and invoices.",
      href: "/dashboard/customers?new=1",
      cta: "Add customer",
    });
  }
  if (shipments.length === 0) {
    recs.push({
      id: "add-shipment",
      icon: Package,
      tint: "bg-primary/15 text-primary",
      title: "Create your first shipment",
      body: "Log a shipment to start tracking cost, routes and delivery.",
      href: "/dashboard/shipments?new=1",
      cta: "Create shipment",
    });
  }

  const nearCapacity = warehouses.filter(
    (w) => w.capacityUnits > 0 && w.usedUnits / w.capacityUnits > 0.9,
  );
  for (const w of nearCapacity) {
    const pct = Math.round((w.usedUnits / w.capacityUnits) * 100);
    recs.push({
      id: `capacity-${w.id}`,
      icon: Gauge,
      tint: "bg-warning/15 text-warning",
      title: `${w.name} is near capacity`,
      body: `Utilization is at ${pct}%. Consider rebalancing stock.`,
      href: "/dashboard/warehouses",
      cta: "Review warehouse",
    });
  }

  const needAttention = shipments.filter(
    (s) => s.status === "delayed" || s.status === "exception",
  ).length;
  if (needAttention > 0) {
    recs.push({
      id: "attention",
      icon: AlertTriangle,
      tint: "bg-destructive/15 text-destructive",
      title: `${needAttention} shipment${needAttention > 1 ? "s" : ""} need attention`,
      body: "Delayed or exception shipments require follow-up.",
      href: "/dashboard/shipments",
      cta: "View shipments",
    });
  }

  const inMaintenance = vehicles.filter((v) => v.status === "maintenance").length;
  if (inMaintenance > 0) {
    recs.push({
      id: "maintenance",
      icon: Wrench,
      tint: "bg-warning/15 text-warning",
      title: `${inMaintenance} vehicle${inMaintenance > 1 ? "s" : ""} in maintenance`,
      body: "These vehicles are unavailable for new assignments.",
      href: "/dashboard/fleet",
      cta: "View fleet",
    });
  }

  const rows = typeof limit === "number" ? recs.slice(0, limit) : recs;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Recommendations</CardTitle>
            <p className="text-xs text-muted-foreground">
              Next steps from your live data
            </p>
          </div>
        </div>
        {rows.length > 0 && <Badge variant="default">{rows.length}</Badge>}
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-success/15 text-success shadow-clay-inset">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">All clear</p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                Your operations look healthy. No action needed right now.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[380px] pr-3">
            <ul className="space-y-3">
              {rows.map((rec) => {
                const Icon = rec.icon;
                return (
                  <li
                    key={rec.id}
                    className="rounded-2xl bg-muted/40 p-3.5 shadow-clay-inset transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                          rec.tint,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{rec.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {rec.body}
                        </p>
                        <Link
                          href={rec.href}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-accent"
                        >
                          {rec.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

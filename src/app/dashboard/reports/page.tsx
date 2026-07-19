"use client";

import * as React from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DollarSign,
  FileText,
  Leaf,
  Package,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { useMounted } from "@/hooks/use-mounted";
import { buildReport, type ReportPeriod } from "@/lib/reports/build";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-clay-sm">
      <div className={cn("mb-2 grid h-8 w-8 place-items-center rounded-lg bg-primary/10", accent)}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const mounted = useMounted();
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";

  const shipments = useCollection("shipments").items;
  const warehouses = useCollection("warehouses").items;
  const vehicles = useCollection("vehicles").items;
  const customers = useCollection("customers").items;
  const invoices = useCollection("invoices").items;

  const [period, setPeriod] = React.useState<ReportPeriod>("weekly");

  // Generated once per mount so the report reflects real client time, never
  // the static build/prerender time.
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const report = React.useMemo(() => {
    if (!now) return null;
    return buildReport({ shipments, warehouses, vehicles, customers, invoices }, period, now);
  }, [shipments, warehouses, vehicles, customers, invoices, period, now]);

  const isEmpty = shipments.length === 0 && warehouses.length === 0 && vehicles.length === 0;

  if (!mounted || !report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Intelligence" description="Auto-generated operations reports computed live from your records." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <PageHeader
          title="Business Intelligence"
          description="Auto-generated operations report — cost, utilization, customer trends and hidden bottlenecks, computed live from your records."
        />
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button variant="gradient" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{org?.name ?? "Operations"} — {PERIODS.find((p) => p.value === period)?.label} Report</h1>
        <p className="text-sm text-muted-foreground">
          {report.range.label} · Generated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FileText}
          title="Nothing to report yet"
          description="Reports are generated automatically once you have shipments, warehouses or fleet on record. Add a few records to see your first report."
        />
      ) : (
        <>
          <FadeIn className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground print:hidden">
            <Badge variant="outline" className="font-normal">
              {report.range.label}
            </Badge>
            <span>·</span>
            <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
          </FadeIn>

          {/* Executive summary */}
          <FadeIn className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <StatTile icon={Package} label="Shipments" value={String(report.summary.shipmentCount)} />
            <StatTile icon={DollarSign} label="Revenue" value={formatCurrency(report.summary.revenue, currency)} />
            <StatTile icon={CheckCircle2} label="On-time rate" value={`${report.summary.onTimeRate}%`} />
            <StatTile icon={AlertTriangle} label="Delayed" value={String(report.summary.delayed)} />
            <StatTile icon={Leaf} label="CO₂" value={`${formatCompact(report.summary.totalCo2Kg)} kg`} />
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Cost optimization */}
            <FadeIn delay={0.05}>
              <SectionCard title="Cost optimization" description="Spend and per-shipment economics for the period.">
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total cost</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(report.cost.totalCost, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg / shipment</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(report.cost.avgCostPerShipment, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost / km</p>
                    <p className="text-lg font-semibold tabular-nums">{formatCurrency(report.cost.costPerKm, currency)}</p>
                  </div>
                </div>
                {report.cost.topLanes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No shipments in this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Top lane</TableHead>
                        <TableHead className="text-right">Shipments</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.cost.topLanes.map((l) => (
                        <TableRow key={l.lane}>
                          <TableCell className="max-w-[200px] truncate text-sm">{l.lane}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.shipments}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(l.totalCost, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </FadeIn>

            {/* Utilization */}
            <FadeIn delay={0.1}>
              <SectionCard title="Fleet & warehouse utilization" description="Current capacity and fleet readiness (org-wide, not period-scoped).">
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg warehouse</p>
                    <p className="text-lg font-semibold tabular-nums">{report.utilization.avgWarehouseUtil}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fleet active</p>
                    <p className="text-lg font-semibold tabular-nums">{report.utilization.activeVehiclePct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In maintenance</p>
                    <p className="text-lg font-semibold tabular-nums">{report.utilization.vehiclesInMaintenance}</p>
                  </div>
                </div>
                {report.utilization.warehouses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No warehouses on record.</p>
                ) : (
                  <div className="space-y-2">
                    {report.utilization.warehouses.map((w) => (
                      <div key={w.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Boxes className="h-3 w-3" /> {w.name}
                          </span>
                          <span className="font-medium tabular-nums">{w.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              w.pct >= 90 ? "bg-destructive" : w.pct >= 75 ? "bg-warning" : "bg-primary",
                            )}
                            style={{ width: `${Math.min(100, w.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </FadeIn>

            {/* Customer trends */}
            <FadeIn delay={0.15}>
              <SectionCard title="Customer trends" description="Top accounts by spend this period.">
                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {report.customers.newCustomers} new customer{report.customers.newCustomers === 1 ? "" : "s"} this period
                </div>
                {report.customers.topCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No billable shipments in this period.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Shipments</TableHead>
                        <TableHead className="text-right">Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.customers.topCustomers.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="text-sm">{c.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.shipments}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(c.spend, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </FadeIn>

            {/* Hidden bottlenecks */}
            <FadeIn delay={0.2}>
              <SectionCard title="Hidden bottlenecks" description="Conditions detected automatically from your data — not fabricated.">
                {report.bottlenecks.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-lg bg-success/10 p-3 text-sm text-success">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    No bottlenecks detected this period.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {report.bottlenecks.map((b) => (
                      <li
                        key={b.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
                          b.severity === "high"
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-warning/30 bg-warning/5",
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            b.severity === "high" ? "text-destructive" : "text-warning",
                          )}
                        />
                        <div>
                          <p className="font-medium">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </FadeIn>
          </div>

          <FadeIn delay={0.25} className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground print:hidden">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            All figures are computed deterministically from your stored records. AI-written narrative summaries are a
            planned upgrade — this report is fully explainable today.
          </FadeIn>
        </>
      )}
    </div>
  );
}

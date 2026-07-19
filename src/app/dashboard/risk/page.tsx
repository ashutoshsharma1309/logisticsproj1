"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Clock,
  Layers,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { StatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { DonutChart } from "@/components/charts";
import { useCollection } from "@/hooks/use-collection";
import { useMounted } from "@/hooks/use-mounted";
import { useAuth } from "@/components/providers/auth-provider";
import { assessAll, summarize } from "@/lib/risk/score";
import type { RiskAssessment, RiskFactor } from "@/lib/risk/score";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

/** Presentation config per risk level — keeps colors/labels consistent across
 *  the donut, score readouts, filter tabs and factor bars. */
const LEVEL_META: Record<
  RiskLevel,
  { label: string; chart: string; text: string; bar: string; ring: string }
> = {
  low: {
    label: "Low",
    chart: "hsl(var(--success))",
    text: "text-success",
    bar: "bg-success",
    ring: "ring-success/25",
  },
  medium: {
    label: "Medium",
    chart: "hsl(var(--warning))",
    text: "text-warning",
    bar: "bg-warning",
    ring: "ring-warning/25",
  },
  high: {
    label: "High",
    chart: "hsl(25 92% 55%)",
    text: "text-destructive",
    bar: "bg-destructive",
    ring: "ring-destructive/25",
  },
  critical: {
    label: "Critical",
    chart: "hsl(var(--destructive))",
    text: "text-destructive",
    bar: "bg-destructive",
    ring: "ring-destructive/30",
  },
};

/** low → critical, the natural reading order for distribution + filters. */
const LEVEL_ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];

type Filter = "all" | RiskLevel;

/** Cap the number of rows that get an entrance animation so long lists stay
 *  responsive — beyond this rows render immediately. */
const ANIMATED_ROWS = 12;

export default function RiskRadarPage() {
  const mounted = useMounted();
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";

  const shipments = useCollection("shipments").items;
  const warehouses = useCollection("warehouses").items;

  const [filter, setFilter] = React.useState<Filter>("all");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // Set on mount so the timestamp reflects real client time, not the static
  // build/prerender time. Unused pre-mount — see the `!mounted` skeleton below.
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const assessments = React.useMemo(
    () => assessAll(shipments, warehouses, now),
    [shipments, warehouses, now],
  );
  const summary = React.useMemo(() => summarize(assessments), [assessments]);

  // Lookups so each row can render its route + live shipment status.
  const shipmentByRef = React.useMemo(
    () => new Map(shipments.map((s) => [s.reference, s])),
    [shipments],
  );
  const warehouseById = React.useMemo(
    () => new Map(warehouses.map((w) => [w.id, w])),
    [warehouses],
  );

  const filtered = React.useMemo(
    () => (filter === "all" ? assessments : assessments.filter((a) => a.level === filter)),
    [assessments, filter],
  );

  const donutData = React.useMemo(
    () =>
      LEVEL_ORDER.map((level) => ({
        label: LEVEL_META[level].label,
        value: summary.byLevel[level],
        level,
      })).filter((d) => d.value > 0),
    [summary],
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Pre-mount: render a stable skeleton (no time-dependent output).
  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Risk Radar"
          description="Explainable, heuristic risk scores computed live from your shipments — with a confidence band and a transparent factor breakdown (model-pluggable)."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const hasActive = assessments.length > 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Risk Radar"
          description="Explainable, heuristic risk scores computed live from your shipments — each with a confidence band and a transparent factor breakdown. The scoring interface is model-pluggable."
        />
      </FadeIn>

      {!hasActive ? (
        <FadeIn delay={0.05}>
          <Card className="p-2">
            <EmptyState
              icon={ShieldCheck}
              title="No active shipments to assess"
              description="Risk scores are derived from your in-flight shipments. Once you create shipments that aren't yet delivered, the radar lights up here."
              action={
                <Button variant="gradient" asChild>
                  <Link href="/dashboard/shipments?new=1">
                    Create a shipment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          </Card>
        </FadeIn>
      ) : (
        <>
          {/* Summary strip */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Layers}
                label="Shipments assessed"
                value={formatNumber(summary.total)}
                hint="Non-delivered, scored live"
              />
              <SummaryCard
                icon={ShieldAlert}
                label="At risk"
                value={formatNumber(summary.atRisk)}
                hint="High + critical exposure"
                tone="destructive"
              />
              <SummaryCard
                icon={Gauge}
                label="Value at risk"
                value={formatCurrency(summary.valueAtRisk, currency)}
                hint="Exposure of at-risk shipments"
                tone="warning"
              />
              <SummaryCard
                icon={Sparkles}
                label="Avg confidence"
                value={`${summary.avgConfidence}%`}
                hint="Data completeness of scores"
              />
            </div>
          </FadeIn>

          {/* Distribution + explainer */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Risk distribution</CardTitle>
                  <CardDescription>
                    Active shipments grouped by assessed risk level.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {donutData.length > 0 ? (
                    <DonutChart
                      data={donutData}
                      colors={donutData.map((d) => LEVEL_META[d.level].chart)}
                    />
                  ) : (
                    <div className="flex h-[260px] items-center justify-center rounded-2xl bg-muted/40 text-sm text-muted-foreground shadow-clay-inset">
                      Nothing to plot yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>What drives a score</CardTitle>
                      <CardDescription>
                        Weighted, deterministic factors — no black box.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {DRIVERS.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-start justify-between gap-4 rounded-2xl bg-muted/40 px-4 py-3 shadow-clay-inset"
                    >
                      <div>
                        <p className="text-sm font-semibold">{d.label}</p>
                        <p className="text-xs text-muted-foreground">{d.detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground shadow-clay-sm">
                        {d.weight}
                      </span>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-muted-foreground">
                    An active exception or delay floors the composite so a genuine
                    problem is never graded merely &ldquo;medium&rdquo;.
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* Filter */}
          <FadeIn delay={0.12}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="all">
                    All
                    <span className="ml-1 tabular-nums text-muted-foreground">
                      {summary.total}
                    </span>
                  </TabsTrigger>
                  {(["critical", "high", "medium", "low"] as const).map((level) => (
                    <TabsTrigger key={level} value={level}>
                      {LEVEL_META[level].label}
                      <span className="ml-1 tabular-nums text-muted-foreground">
                        {summary.byLevel[level]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                Showing {formatNumber(filtered.length)} of{" "}
                {formatNumber(summary.total)} · sorted by risk
              </p>
            </div>
          </FadeIn>

          {/* Assessment list */}
          {filtered.length === 0 ? (
            <Card className="p-2">
              <EmptyState
                icon={ShieldCheck}
                title="Nothing at this level"
                description="No active shipments fall into the selected risk band. Try a different filter."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const shipment = shipmentByRef.get(a.reference);
                const origin = shipment
                  ? warehouseById.get(shipment.originWarehouseId)?.name ?? "Unknown origin"
                  : "Unknown origin";
                const destination = shipment?.destinationCity ?? "—";
                const isOpen = expanded.has(a.shipmentId);
                const row = (
                  <AssessmentRow
                    assessment={a}
                    origin={origin}
                    destination={destination}
                    status={shipment?.status}
                    currency={currency}
                    open={isOpen}
                    onToggle={() => toggle(a.shipmentId)}
                  />
                );
                return i < ANIMATED_ROWS ? (
                  <FadeIn key={a.shipmentId} delay={Math.min(i * 0.03, 0.3)} y={12}>
                    {row}
                  </FadeIn>
                ) : (
                  <div key={a.shipmentId}>{row}</div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const DRIVERS: { label: string; detail: string; weight: string }[] = [
  {
    label: "Operational status",
    detail: "Current lifecycle stage — exceptions and delays weigh heaviest.",
    weight: "30%",
  },
  {
    label: "Schedule pressure",
    detail: "Required transit time at the mode's pace vs. remaining time to ETA.",
    weight: "26%",
  },
  {
    label: "Route exposure",
    detail: "Baseline weather / customs / handling risk for the transport mode.",
    weight: "16%",
  },
  {
    label: "Origin congestion",
    detail: "Capacity utilization at the originating warehouse.",
    weight: "16%",
  },
  {
    label: "SLA exposure",
    detail: "Priority commitment on the shipment (standard → critical).",
    weight: "12%",
  },
];

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: "primary" | "destructive" | "warning";
}) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/12 text-destructive"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/12 text-primary";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl shadow-clay-inset", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold tracking-tight tabular-nums",
            tone === "destructive" && "text-destructive",
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </Card>
  );
}

function AssessmentRow({
  assessment: a,
  origin,
  destination,
  status,
  currency,
  open,
  onToggle,
}: {
  assessment: RiskAssessment;
  origin: string;
  destination: string;
  status: React.ComponentProps<typeof StatusBadge>["status"] | undefined;
  currency: string;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = LEVEL_META[a.level];
  const panelId = `risk-panel-${a.shipmentId}`;
  return (
    <Card variant="flat" className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full flex-col gap-4 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-5"
      >
        {/* Score */}
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1 shadow-clay-inset",
            meta.ring,
          )}
        >
          <span className={cn("text-2xl font-bold leading-none tabular-nums", meta.text)}>
            {a.score}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            risk
          </span>
        </div>

        {/* Identity + route */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{a.reference}</span>
            <RiskBadge level={a.level} />
            {status && <StatusBadge status={status} />}
          </div>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <span className="truncate">{origin}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{destination}</span>
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Top factor: <span className="text-foreground">{a.topFactor}</span>
          </p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {a.confidence}% conf.
          </span>
          {a.projectedDelayDays > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-warning">
              <Clock className="h-3 w-3" />~{a.projectedDelayDays}d late
            </span>
          )}
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(a.valueUsd, currency)}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div id={panelId} className="border-t border-border bg-muted/20 p-4 sm:px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Factor breakdown
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {a.factors.map((f) => (
              <FactorBar key={f.key} factor={f} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FactorBar({ factor }: { factor: RiskFactor }) {
  const barTone =
    factor.score >= 75
      ? "bg-destructive"
      : factor.score >= 55
        ? "bg-destructive/80"
        : factor.score >= 30
          ? "bg-warning"
          : "bg-success";
  return (
    <div className="rounded-2xl bg-card p-3 shadow-clay-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{factor.label}</span>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {Math.round(factor.score)}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted shadow-clay-inset"
        role="progressbar"
        aria-valuenow={Math.round(factor.score)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${factor.label} risk contribution`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barTone)}
          style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{factor.detail}</p>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {Math.round(factor.weight * 100)}% wt
        </span>
      </div>
    </div>
  );
}

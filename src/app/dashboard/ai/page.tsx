"use client";

import * as React from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Route,
  ShieldAlert,
  Warehouse,
  TrendingUp,
  DollarSign,
  Fingerprint,
  HeartPulse,
  Lightbulb,
  Zap,
  Gauge,
  CheckCircle2,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { EmptyState } from "@/components/shared/empty-state";
import { getStore } from "@/services/store";
import { healthColor } from "@/config/status";
import { formatCurrency, relativeTime, cn } from "@/lib/utils";
import type { AiInsight } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const TYPE_META: Record<
  AiInsight["type"],
  { label: string; icon: LucideIcon; tint: string; accent: string }
> = {
  delay: {
    label: "Delay",
    icon: AlertTriangle,
    tint: "bg-warning/15 text-warning",
    accent: "bg-warning",
  },
  route: {
    label: "Route",
    icon: Route,
    tint: "bg-primary/15 text-primary",
    accent: "bg-primary",
  },
  risk: {
    label: "Risk",
    icon: ShieldAlert,
    tint: "bg-destructive/15 text-destructive",
    accent: "bg-destructive",
  },
  warehouse: {
    label: "Warehouse",
    icon: Warehouse,
    tint: "bg-secondary/15 text-secondary",
    accent: "bg-secondary",
  },
  demand: {
    label: "Demand",
    icon: TrendingUp,
    tint: "bg-accent/15 text-accent",
    accent: "bg-accent",
  },
  cost: {
    label: "Cost",
    icon: DollarSign,
    tint: "bg-success/15 text-success",
    accent: "bg-success",
  },
  fraud: {
    label: "Fraud",
    icon: Fingerprint,
    tint: "bg-destructive/15 text-destructive",
    accent: "bg-destructive",
  },
  health: {
    label: "Health",
    icon: HeartPulse,
    tint: "bg-accent/15 text-accent",
    accent: "bg-accent",
  },
};

const IMPACT_VARIANT: Record<AiInsight["impact"], BadgeVariant> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

const CAPABILITIES: {
  name: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  accuracy: number;
}[] = [
  {
    name: "Delay Prediction",
    description: "Flags shipments likely to miss their ETA window.",
    icon: AlertTriangle,
    tint: "bg-warning/15 text-warning",
    accuracy: 94,
  },
  {
    name: "Route Suggestions",
    description: "Recommends faster, lower-cost lane alternatives.",
    icon: Route,
    tint: "bg-primary/15 text-primary",
    accuracy: 91,
  },
  {
    name: "Risk Prediction",
    description: "Scores exposure from weather, customs and carriers.",
    icon: ShieldAlert,
    tint: "bg-destructive/15 text-destructive",
    accuracy: 89,
  },
  {
    name: "Warehouse Optimization",
    description: "Balances load and slotting across facilities.",
    icon: Warehouse,
    tint: "bg-secondary/15 text-secondary",
    accuracy: 88,
  },
  {
    name: "Demand Forecast",
    description: "Projects volume by lane to pre-position capacity.",
    icon: TrendingUp,
    tint: "bg-accent/15 text-accent",
    accuracy: 92,
  },
  {
    name: "Cost Prediction",
    description: "Estimates landed cost and surcharge drift.",
    icon: DollarSign,
    tint: "bg-success/15 text-success",
    accuracy: 90,
  },
  {
    name: "Shipment Health Score",
    description: "Composite condition index for every in-flight load.",
    icon: HeartPulse,
    tint: "bg-accent/15 text-accent",
    accuracy: 95,
  },
  {
    name: "Fraud Detection",
    description: "Detects ledger anomalies and tampering signals.",
    icon: Fingerprint,
    tint: "bg-destructive/15 text-destructive",
    accuracy: 97,
  },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  ...(
    Object.keys(TYPE_META) as AiInsight["type"][]
  ).map((t) => ({ value: t, label: TYPE_META[t].label })),
];

export default function AiInsightsPage() {
  const [insights, setInsights] = React.useState<AiInsight[]>(
    () => getStore().insights,
  );
  const shipments = React.useMemo(() => getStore().shipments, []);
  const [running, setRunning] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [impactFilter, setImpactFilter] = React.useState("all");

  const stats = React.useMemo(() => {
    const highImpact = insights.filter((i) => i.impact === "high").length;
    const savings = insights.reduce((a, i) => a + (i.savingsUsd ?? 0), 0);
    const avgConfidence = insights.length
      ? Math.round(
          insights.reduce((a, i) => a + i.confidence, 0) / insights.length,
        )
      : 0;
    return { highImpact, savings, avgConfidence };
  }, [insights]);

  const statCards = [
    {
      label: "Total insights",
      value: String(insights.length),
      icon: Lightbulb,
      tint: "bg-primary/12 text-primary",
    },
    {
      label: "High-impact",
      value: String(stats.highImpact),
      icon: Zap,
      tint: "bg-destructive/12 text-destructive",
    },
    {
      label: "Projected savings",
      value: formatCurrency(stats.savings),
      icon: DollarSign,
      tint: "bg-success/12 text-success",
    },
    {
      label: "Avg confidence",
      value: `${stats.avgConfidence}%`,
      icon: Gauge,
      tint: "bg-accent/12 text-accent",
    },
  ];

  const filtered = insights.filter(
    (i) =>
      (typeFilter === "all" || i.type === typeFilter) &&
      (impactFilter === "all" || i.impact === impactFilter),
  );

  const healthRows = React.useMemo(
    () =>
      [...shipments]
        .sort((a, b) => b.delayProbability - a.delayProbability)
        .slice(0, 7),
    [shipments],
  );

  function runAnalysis() {
    if (running) return;
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      toast.success("Analysis complete", {
        description: "The prediction engine refreshed all live insights.",
      });
    }, 1600);
  }

  function applyRecommendation(insight: AiInsight) {
    toast.success("Recommendation applied", {
      description: insight.title,
    });
  }

  function dismiss(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id));
    toast("Insight dismissed");
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="AI Intelligence"
          description="A live prediction engine that fuses ledger, telemetry and market signals to surface the next best action across your network."
        >
          <Button variant="gradient" onClick={runAnalysis} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {running ? "Analyzing…" : "Run analysis"}
          </Button>
        </PageHeader>
      </FadeIn>

      {/* Stat row */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className="flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg"
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-clay-inset",
                    s.tint,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight">
                    {s.value}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </FadeIn>

      {/* Capabilities grid */}
      <FadeIn delay={0.1}>
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Prediction Capabilities
          </h2>
          <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => {
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
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={c.accuracy} className="h-1.5" />
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        {c.accuracy}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Model accuracy
                    </p>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </FadeIn>

      {/* Feed + health rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Insights feed */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.05}>
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
                    {filtered.length} active recommendation
                    {filtered.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[136px]" aria-label="Filter by type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={impactFilter} onValueChange={setImpactFilter}>
                  <SelectTrigger className="w-[132px]" aria-label="Filter by impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All impact</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FadeIn>

          {filtered.length === 0 ? (
            <Card className="p-2">
              <EmptyState
                icon={Sparkles}
                title="No matching insights"
                description="Adjust the filters or run a fresh analysis to generate new recommendations."
                action={
                  <Button variant="clay" onClick={runAnalysis}>
                    <Sparkles className="h-4 w-4" />
                    Run analysis
                  </Button>
                }
              />
            </Card>
          ) : (
            <StaggerGroup className="space-y-4">
              {filtered.map((insight) => {
                const meta = TYPE_META[insight.type];
                const Icon = meta.icon;
                return (
                  <StaggerItem key={insight.id}>
                    <Card className="relative overflow-hidden">
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 w-1.5",
                          meta.accent,
                        )}
                        aria-hidden
                      />
                      <CardContent className="p-5 pl-6">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-clay-inset",
                              meta.tint,
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{insight.title}</h3>
                              <Badge
                                variant={IMPACT_VARIANT[insight.impact]}
                                className="capitalize"
                              >
                                {insight.impact} impact
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {meta.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Confidence
                          </span>
                          <Progress value={insight.confidence} className="h-1.5" />
                          <span className="shrink-0 text-xs font-semibold tabular-nums">
                            {insight.confidence}%
                          </span>
                        </div>

                        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-primary/8 p-3.5 shadow-clay-inset">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Recommendation
                            </p>
                            <p className="mt-0.5 text-sm text-foreground">
                              {insight.recommendation}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                          {typeof insight.savingsUsd === "number" && (
                            <Badge variant="success">
                              {formatCurrency(insight.savingsUsd)} saved
                            </Badge>
                          )}
                          {insight.relatedShipment && (
                            <Badge variant="muted">
                              {insight.relatedShipment}
                            </Badge>
                          )}
                          <span className="ml-auto text-muted-foreground">
                            {relativeTime(insight.createdAt)}
                          </span>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="clay"
                            onClick={() => applyRecommendation(insight)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Apply recommendation
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismiss(insight.id)}
                          >
                            <X className="h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </div>

        {/* Health rail */}
        <div className="lg:col-span-1">
          <FadeIn delay={0.1}>
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-accent shadow-clay-inset">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Shipment Health Scores</CardTitle>
                    <CardDescription>Highest delay risk first</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthRows.map((s) => {
                  const risk = Math.round(s.delayProbability * 100);
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl bg-muted/40 p-3.5 shadow-clay-inset"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-xs font-semibold">
                          {s.reference}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            healthColor(s.healthScore),
                          )}
                        >
                          {s.healthScore}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Delay risk
                        </span>
                        <Progress
                          value={risk}
                          className="h-1.5"
                          indicatorClassName={
                            risk >= 60
                              ? "bg-destructive"
                              : risk >= 30
                                ? "bg-warning"
                                : "bg-success"
                          }
                        />
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {risk}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

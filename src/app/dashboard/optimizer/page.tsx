"use client";

import * as React from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  Truck,
  Train,
  Ship,
  Plane,
  Waypoints,
  Leaf,
  Clock,
  DollarSign,
  ShieldCheck,
  Sparkles,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { Field, NativeSelect } from "@/components/form/field";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { optimize, type ObjectiveKey, type ObjectiveWeights, type ScoredPlan } from "@/lib/optimize/plan";
import { formatCurrency, formatCompact, formatNumber, cn } from "@/lib/utils";
import type { TransportMode } from "@/types";

/* ------------------------------------------------------------------ *
 * Mode presentation — icon + colour. Text labels come from the engine
 * (plan.label), so nothing here is fabricated: it is pure display glue.
 * ------------------------------------------------------------------ */
const MODE_META: Record<TransportMode, { icon: LucideIcon; color: string }> = {
  truck: { icon: Truck, color: "hsl(var(--primary))" },
  rail: { icon: Train, color: "hsl(var(--secondary))" },
  ship: { icon: Ship, color: "hsl(var(--accent))" },
  plane: { icon: Plane, color: "hsl(var(--warning))" },
};

interface ObjectiveMeta {
  key: ObjectiveKey;
  label: string;
  icon: LucideIcon;
}

const OBJECTIVES: ObjectiveMeta[] = [
  { key: "cost", label: "Cost", icon: DollarSign },
  { key: "time", label: "Time", icon: Clock },
  { key: "co2", label: "CO₂", icon: Leaf },
  { key: "reliability", label: "Reliability", icon: ShieldCheck },
];

const PRESETS: Record<string, ObjectiveWeights> = {
  Cheapest: { cost: 100, time: 20, co2: 20, reliability: 30 },
  Fastest: { cost: 20, time: 100, co2: 15, reliability: 40 },
  Greenest: { cost: 25, time: 20, co2: 100, reliability: 35 },
};

const DEFAULT_LANE = { distanceKm: 5000, weightKg: 8000 };
const BALANCED: ObjectiveWeights = { cost: 50, time: 50, co2: 50, reliability: 50 };

/* ------------------------------------------------------------------ */

function rationale(weights: ObjectiveWeights, rec: ScoredPlan): string {
  const phrases: Record<ObjectiveKey, string> = {
    cost: "lowest landed cost",
    time: "fastest transit",
    co2: "lowest emissions",
    reliability: "highest reliability",
  };
  const ranked = (Object.keys(weights) as ObjectiveKey[]).sort(
    (a, b) => weights[b] - weights[a],
  );
  const [top, second] = ranked;
  if (weights[top] - weights[second] <= 10) {
    return `Best balance across cost, time, CO₂ and reliability for your current priorities.`;
  }
  return `Optimises for ${phrases[top]} — the priority you weighted highest.`;
}

/** Custom scatter mark: bigger + haloed on the Pareto frontier, ringed if recommended. */
function PlanDot(props: {
  cx?: number;
  cy?: number;
  payload?: ScoredPlan;
  recommendedId?: string;
}) {
  const { cx, cy, payload, recommendedId } = props;
  if (cx == null || cy == null || !payload) return null;
  const color = MODE_META[payload.mode].color;
  const isRec = payload.id === recommendedId;
  const r = payload.onFrontier ? 9 : 6;
  return (
    <g>
      {isRec && (
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeOpacity={0.4} strokeWidth={2} />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        fillOpacity={payload.onFrontier ? 1 : 0.55}
        stroke="hsl(var(--background))"
        strokeWidth={payload.onFrontier ? 2 : 1}
      />
    </g>
  );
}

function ScatterTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScoredPlan }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const plan = payload[0].payload;
  const Icon = MODE_META[plan.mode].icon;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2.5 text-xs shadow-clay-lg">
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
        <Icon className="h-3.5 w-3.5" style={{ color: MODE_META[plan.mode].color }} />
        {plan.label}
        {plan.onFrontier && (
          <Badge variant="success" className="ml-1 px-1.5 py-0 text-[10px]">
            Pareto
          </Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 tabular-nums">
        <dt className="text-muted-foreground">Cost</dt>
        <dd className="text-right font-medium">{formatCurrency(plan.costUsd, currency)}</dd>
        <dt className="text-muted-foreground">Transit</dt>
        <dd className="text-right font-medium">{formatNumber(plan.transitDays, 1)} d</dd>
        <dt className="text-muted-foreground">CO₂</dt>
        <dd className="text-right font-medium">{formatNumber(plan.co2Kg, 1)} kg</dd>
        <dt className="text-muted-foreground">Reliability</dt>
        <dd className="text-right font-medium">{plan.reliability}%</dd>
        <dt className="text-muted-foreground">Score</dt>
        <dd className="text-right font-semibold text-primary">{plan.score}</dd>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function OptimizerPage() {
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";
  const shipments = useCollection("shipments").items;
  const warehouses = useCollection("warehouses").items;

  const [distanceKm, setDistanceKm] = React.useState(DEFAULT_LANE.distanceKm);
  const [weightKg, setWeightKg] = React.useState(DEFAULT_LANE.weightKg);
  const [selectedId, setSelectedId] = React.useState("");
  const [weights, setWeights] = React.useState<ObjectiveWeights>(BALANCED);

  const cityOf = React.useCallback(
    (warehouseId: string) => warehouses.find((w) => w.id === warehouseId)?.city ?? "Origin",
    [warehouses],
  );

  function pickShipment(id: string) {
    setSelectedId(id);
    const s = shipments.find((x) => x.id === id);
    if (s) {
      setDistanceKm(s.distanceKm);
      setWeightKg(s.weightKg);
    }
  }

  const result = React.useMemo(
    () => optimize({ distanceKm, weightKg }, weights),
    [distanceKm, weightKg, weights],
  );
  const { plans, recommended } = result;

  const activePreset = React.useMemo(
    () =>
      Object.entries(PRESETS).find(
        ([, w]) =>
          w.cost === weights.cost &&
          w.time === weights.time &&
          w.co2 === weights.co2 &&
          w.reliability === weights.reliability,
      )?.[0] ?? null,
    [weights],
  );

  const RecIcon = recommended ? MODE_META[recommended.mode].icon : Waypoints;
  const costDomain = plans.map((p) => p.costUsd);
  const yPad = Math.max(1, Math.round((Math.max(...costDomain, 0) - Math.min(...costDomain, 0)) * 0.12));

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Route Optimizer"
          description="Multi-objective optimization across cost, time, CO₂ and reliability — pick your priorities and see the optimal mode + the trade-offs (not just shortest path)."
        />
      </FadeIn>

      {/* CONTROLS ---------------------------------------------------- */}
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                <Waypoints className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Lane &amp; priorities</CardTitle>
                <CardDescription>
                  Choose a lane, then weight the objectives — everything recomputes live.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            {/* Lane selector */}
            <div className="space-y-4">
              <Field label="Shipment lane" htmlFor="opt-shipment" hint="pre-fills distance & weight">
                <NativeSelect
                  id="opt-shipment"
                  value={selectedId}
                  onChange={(e) => pickShipment(e.target.value)}
                  aria-label="Select an existing shipment lane"
                >
                  <option value="">
                    {shipments.length ? "Custom lane (enter below)" : "No shipments — using a sample lane"}
                  </option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.reference} — {cityOf(s.originWarehouseId)}→{s.destinationCity}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Distance (km)" htmlFor="opt-distance">
                  <Input
                    id="opt-distance"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="tabular-nums"
                    value={distanceKm}
                    onChange={(e) => {
                      setSelectedId("");
                      setDistanceKm(Math.max(0, Number(e.target.value) || 0));
                    }}
                  />
                </Field>
                <Field label="Weight (kg)" htmlFor="opt-weight">
                  <Input
                    id="opt-weight"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="tabular-nums"
                    value={weightKg}
                    onChange={(e) => {
                      setSelectedId("");
                      setWeightKg(Math.max(0, Number(e.target.value) || 0));
                    }}
                  />
                </Field>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {shipments.length === 0
                  ? "No shipments yet — optimizing a sample lane. Enter your own distance & weight above."
                  : selectedId
                    ? "Optimizing the selected shipment's lane."
                    : "Custom lane — pick a shipment above to pre-fill, or edit the numbers."}
              </p>
            </div>

            {/* Objective weights */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Objective weights</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(PRESETS).map((name) => (
                    <Button
                      key={name}
                      type="button"
                      size="sm"
                      variant={activePreset === name ? "default" : "outline"}
                      onClick={() => setWeights(PRESETS[name])}
                      aria-pressed={activePreset === name}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                {OBJECTIVES.map(({ key, label, icon: Icon }) => {
                  const id = `w-${key}`;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </Label>
                        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                          {weights[key]}
                        </span>
                      </div>
                      <input
                        id={id}
                        type="range"
                        min={0}
                        max={100}
                        value={weights[key]}
                        onChange={(e) =>
                          setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                        }
                        aria-label={`${label} priority weight`}
                        aria-valuetext={`${weights[key]} of 100`}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary shadow-clay-inset"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* RECOMMENDED + SCATTER -------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recommended hero */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card className="h-full shadow-glow ring-1 ring-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="default" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended
                </Badge>
                {recommended?.onFrontier && (
                  <Badge variant="success">Pareto-optimal</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {recommended ? (
                <>
                  <div className="flex items-center gap-4">
                    <div
                      className="grid h-14 w-14 place-items-center rounded-2xl shadow-clay-sm"
                      style={{
                        background: `color-mix(in oklab, ${MODE_META[recommended.mode].color} 16%, transparent)`,
                        color: MODE_META[recommended.mode].color,
                      }}
                    >
                      <RecIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xl font-bold leading-tight">{recommended.label}</p>
                      <p className="text-xs text-muted-foreground">Optimal transport mode</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-4xl font-bold tracking-tight tabular-nums text-primary">
                        {recommended.score}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground">score / 100</p>
                    </div>
                  </div>

                  <Separator />

                  <dl className="grid grid-cols-2 gap-3">
                    <Metric
                      icon={DollarSign}
                      label="Cost"
                      value={formatCurrency(recommended.costUsd, currency)}
                    />
                    <Metric
                      icon={Clock}
                      label="Transit"
                      value={`${formatNumber(recommended.transitDays, 1)} d`}
                    />
                    <Metric
                      icon={Leaf}
                      label="CO₂"
                      value={`${formatNumber(recommended.co2Kg, 1)} kg`}
                      accent="text-success"
                    />
                    <Metric
                      icon={ShieldCheck}
                      label="Reliability"
                      value={`${recommended.reliability}%`}
                    />
                  </dl>

                  <p className="text-xs text-muted-foreground">{rationale(weights, recommended)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter a lane above to compute a recommendation.
                </p>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Trade-off scatter */}
        <FadeIn delay={0.15} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Trade-off frontier</CardTitle>
              <CardDescription>
                Cost vs transit time for every mode. Larger haloed points are Pareto-optimal; the
                ringed point is recommended.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 12, right: 16, bottom: 24, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      dataKey="transitDays"
                      name="Transit"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={(v: number) => `${formatNumber(v, 1)}d`}
                      label={{
                        value: "Transit (days)",
                        position: "insideBottom",
                        offset: -12,
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="costUsd"
                      name="Cost"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      domain={[`dataMin - ${yPad}`, `dataMax + ${yPad}`]}
                      tickFormatter={(v: number) => formatCompact(v)}
                      label={{
                        value: "Cost",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <ZAxis range={[80, 80]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--border))" }}
                      content={<ScatterTooltip currency={currency} />}
                    />
                    <Scatter
                      data={plans}
                      isAnimationActive
                      shape={<PlanDot recommendedId={recommended?.id} />}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* Mode legend */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                {plans.map((p) => {
                  const Icon = MODE_META[p.mode].icon;
                  return (
                    <span key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" style={{ color: MODE_META[p.mode].color }} />
                      {p.label}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* COMPARISON TABLE ------------------------------------------- */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Mode comparison</CardTitle>
            <CardDescription>
              All candidate plans, ranked by weighted score for your current priorities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Mode</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Cost</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Transit</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">CO₂</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Reliability</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold">Score</th>
                    <th scope="col" className="py-2.5 pl-4 text-right font-semibold">Frontier</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => {
                    const Icon = MODE_META[p.mode].icon;
                    const isRec = p.id === recommended?.id;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          isRec && "bg-primary/[0.06]",
                        )}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5 font-medium">
                            <span
                              className="grid h-8 w-8 place-items-center rounded-lg"
                              style={{
                                background: `color-mix(in oklab, ${MODE_META[p.mode].color} 14%, transparent)`,
                                color: MODE_META[p.mode].color,
                              }}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            {p.label}
                            {isRec && (
                              <Badge variant="default" className="gap-1 px-1.5 py-0 text-[10px]">
                                <Sparkles className="h-3 w-3" />
                                Best
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(p.costUsd, currency)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(p.transitDays, 1)} d
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(p.co2Kg, 1)} kg
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{p.reliability}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted shadow-clay-inset">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                                style={{ width: `${p.score}%` }}
                              />
                            </div>
                            <span className="w-7 text-right text-xs font-semibold tabular-nums">
                              {p.score}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          {p.onFrontier ? (
                            <Badge variant="success">Pareto-optimal</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">dominated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5 shadow-clay-inset">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", accent)} />
        {label}
      </dt>
      <dd className={cn("mt-0.5 text-base font-semibold tabular-nums", accent)}>{value}</dd>
    </div>
  );
}

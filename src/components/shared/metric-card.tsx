"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import * as Icons from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";
import { useCounter } from "@/hooks/use-counter";
import type { KpiMetric } from "@/types";

interface MetricCardProps {
  metric: KpiMetric;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const Icon = (Icons[metric.icon as keyof typeof Icons] ?? Icons.Activity) as Icons.LucideIcon;
  const data = metric.spark.map((v, i) => ({ i, v }));
  const positive = metric.positive;
  const gradId = `grad-${metric.id}`;

  return (
    <Card className={cn("group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg", className)}>
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
          )}
        >
          {metric.trend === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {formatPercent(metric.delta)}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{metric.formatted}</p>
      </div>

      <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-14 opacity-70">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/** Animated counting number for hero / stats sections. */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const { value: current, ref } = useCounter(value);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {current.toLocaleString("en-US", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

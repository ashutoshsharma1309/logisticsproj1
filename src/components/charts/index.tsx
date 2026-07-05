"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "@/types";

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-xs shadow-clay-lg">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SeriesConfig {
  key: string;
  color?: string;
  label?: string;
}

export function AreaTrend({
  data,
  series,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  series: SeriesConfig[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2.5}
            fill={`url(#area-${s.key})`}
            isAnimationActive
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarStat({
  data,
  series,
  height = 260,
  stacked = false,
}: {
  data: TimeSeriesPoint[];
  series: SeriesConfig[];
  height?: number;
  stacked?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            stackId={stacked ? "a" : undefined}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={stacked ? [0, 0, 0, 0] : [6, 6, 0, 0]}
            isAnimationActive
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 260,
  colors = CHART_COLORS,
}: {
  data: TimeSeriesPoint[];
  height?: number;
  colors?: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="88%"
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => <span className="text-muted-foreground">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ForecastChart({
  data,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={40} domain={[60, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#band)" isAnimationActive={false} />
        <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} isAnimationActive={false} />
        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineForecast({
  data,
  series,
  height = 260,
}: {
  data: TimeSeriesPoint[];
  series: SeriesConfig[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RadialGauge({
  value,
  label,
  color = "hsl(var(--primary))",
  size = 180,
}: {
  value: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const data = [{ name: label ?? "value", value, fill: color }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "hsl(var(--muted))" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(value)}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

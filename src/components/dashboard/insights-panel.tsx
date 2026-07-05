"use client";

import {
  AlertTriangle,
  Route,
  ShieldAlert,
  Warehouse,
  TrendingUp,
  DollarSign,
  Fingerprint,
  HeartPulse,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStore } from "@/services/store";
import { formatCurrency, cn } from "@/lib/utils";
import type { AiInsight } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

const TYPE_META: Record<
  AiInsight["type"],
  { icon: LucideIcon; tint: string }
> = {
  delay: { icon: AlertTriangle, tint: "bg-warning/15 text-warning" },
  route: { icon: Route, tint: "bg-primary/15 text-primary" },
  risk: { icon: ShieldAlert, tint: "bg-destructive/15 text-destructive" },
  warehouse: { icon: Warehouse, tint: "bg-secondary/15 text-secondary" },
  demand: { icon: TrendingUp, tint: "bg-accent/15 text-accent" },
  cost: { icon: DollarSign, tint: "bg-success/15 text-success" },
  fraud: { icon: Fingerprint, tint: "bg-destructive/15 text-destructive" },
  health: { icon: HeartPulse, tint: "bg-accent/15 text-accent" },
};

const IMPACT_VARIANT: Record<AiInsight["impact"], NonNullable<BadgeProps["variant"]>> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

export function InsightsPanel({ limit }: { limit?: number }) {
  const { insights } = getStore();
  const rows = typeof limit === "number" ? insights.slice(0, limit) : insights;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>AI Suggestions</CardTitle>
            <p className="text-xs text-muted-foreground">
              Model-driven recommendations
            </p>
          </div>
        </div>
        <Badge variant="default">{rows.length}</Badge>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ScrollArea className="h-[380px] pr-3">
          <ul className="space-y-3">
            {rows.map((insight) => {
              const meta = TYPE_META[insight.type];
              const Icon = meta.icon;
              return (
                <li
                  key={insight.id}
                  className="rounded-2xl bg-muted/40 p-3.5 shadow-clay-inset transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        meta.tint,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {insight.title}
                        </p>
                        <Badge
                          variant={IMPACT_VARIANT[insight.impact]}
                          className="shrink-0 capitalize"
                        >
                          {insight.impact}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {insight.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Confidence
                          </span>
                          <Progress
                            value={insight.confidence}
                            className="h-1.5"
                          />
                          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                            {insight.confidence}%
                          </span>
                        </div>
                        {typeof insight.savingsUsd === "number" && (
                          <span className="shrink-0 text-xs font-semibold text-success">
                            {formatCurrency(insight.savingsUsd)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

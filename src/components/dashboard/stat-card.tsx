"use client";

import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stat } from "@/lib/analytics/compute";

export function StatCard({ stat, className }: { stat: Stat; className?: string }) {
  const Icon = (Icons[stat.icon as keyof typeof Icons] ?? Icons.Activity) as Icons.LucideIcon;
  return (
    <Card
      className={cn(
        "group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl shadow-clay-inset",
            stat.empty ? "bg-muted text-muted-foreground" : "bg-primary/12 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold tracking-tight",
            stat.empty && "text-muted-foreground/50",
          )}
        >
          {stat.display}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">{stat.hint}</p>
      </div>
    </Card>
  );
}

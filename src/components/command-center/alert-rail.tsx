"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity } from "@/lib/alerts/derive";

const SEVERITY: Record<AlertSeverity, { dot: string; icon: string; ring: string; label: string }> = {
  critical: { dot: "bg-destructive", icon: "text-destructive", ring: "bg-destructive/10", label: "Critical" },
  warning: { dot: "bg-warning", icon: "text-warning", ring: "bg-warning/10", label: "Warning" },
  info: { dot: "bg-primary", icon: "text-primary", ring: "bg-primary/10", label: "Info" },
};

function AlertRow({ alert }: { alert: Alert }) {
  const s = SEVERITY[alert.severity];
  const Icon = (Icons[alert.icon as keyof typeof Icons] ?? Icons.Bell) as Icons.LucideIcon;
  return (
    <Link
      href={alert.href}
      className="group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/60"
    >
      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", s.ring)}>
        <Icon className={cn("h-4 w-4", s.icon)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
          <span className="truncate text-sm font-medium">{alert.title}</span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{alert.body}</span>
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function AlertRail({ alerts, className }: { alerts: Alert[]; className?: string }) {
  const criticals = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          Live Alerts
          {alerts.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                criticals > 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning",
              )}
            >
              {alerts.length}
            </span>
          )}
        </CardTitle>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          live
        </span>
      </CardHeader>
      <CardContent className="flex-1 p-2 pt-0">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" />
            </span>
            <p className="text-sm font-medium">All systems nominal</p>
            <p className="text-xs text-muted-foreground">
              No operational issues detected across your network.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-0.5">
              {alerts.map((a) => (
                <AlertRow key={a.id} alert={a} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

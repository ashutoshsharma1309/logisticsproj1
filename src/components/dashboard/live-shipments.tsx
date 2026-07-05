"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight, Radio } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { getStore } from "@/services/store";
import { MODE_META } from "@/config/status";
import { formatDate } from "@/lib/utils";

function cityOf(label: string): string {
  return label.split(",")[0]?.trim() ?? label;
}

export function LiveShipments() {
  const { shipments } = getStore();
  const live = shipments
    .filter(
      (s) => s.status === "in_transit" || s.status === "out_for_delivery",
    )
    .slice(0, 6);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
            <Radio className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 animate-pulse-ring rounded-full bg-success" />
          </div>
          <div>
            <CardTitle>Live Shipments</CardTitle>
            <p className="text-xs text-muted-foreground">
              Currently moving through the network
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/shipments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-accent"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-2.5 pb-4">
        {live.map((s) => {
          const ModeIcon = (Icons[
            MODE_META[s.mode].icon as keyof typeof Icons
          ] ?? Icons.Truck) as Icons.LucideIcon;
          return (
            <Link
              key={s.id}
              href="/dashboard/shipments"
              className="block rounded-2xl bg-muted/40 p-3.5 shadow-clay-inset transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-clay-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
                    <ModeIcon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {s.reference}
                  </span>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate font-medium text-foreground">
                  {cityOf(s.origin.label)}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="truncate font-medium text-foreground">
                  {cityOf(s.destination.label)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <Progress value={s.progress} className="h-1.5" />
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {s.progress}%
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-muted-foreground">
                ETA {formatDate(s.eta)}
              </p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

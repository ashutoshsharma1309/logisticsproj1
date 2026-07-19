"use client";

import Link from "next/link";
import { ArrowUpRight, Radar } from "lucide-react";
import { WorldMap } from "@/components/map/world-map";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NetworkModel } from "@/lib/network";

export function NetworkPanel({ network, className }: { network: NetworkModel; className?: string }) {
  const hasRoutes = network.routes.length > 0;

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          <span className="text-base font-semibold">Network Map</span>
          {hasRoutes && (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              {network.routes.length} active
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/dashboard/simulation">
            Open simulator <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="relative min-h-[300px] flex-1 bg-muted/20">
        {hasRoutes ? (
          <WorldMap
            nodes={network.nodes}
            routes={network.routes}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="grid h-full place-items-center p-6">
            <EmptyState
              icon={Radar}
              title="No active shipments to map"
              description="Create shipments with an origin and destination to see your live network."
              action={
                <Button size="sm" asChild>
                  <Link href="/dashboard/shipments?new=1">Create shipment</Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </Card>
  );
}

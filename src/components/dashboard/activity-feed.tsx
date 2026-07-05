"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStore } from "@/services/store";
import { relativeTime, cn } from "@/lib/utils";
import type { ActivityLog } from "@/types";

const TYPE_DOT: Record<ActivityLog["type"], string> = {
  create: "bg-success",
  update: "bg-primary",
  delete: "bg-destructive",
  verify: "bg-accent",
  alert: "bg-warning",
  login: "bg-muted-foreground",
};

export function ActivityFeed({ limit }: { limit?: number }) {
  const { activity } = getStore();
  const rows = typeof limit === "number" ? activity.slice(0, limit) : activity;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Latest network events across your operation
        </p>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ScrollArea className="h-[340px] pr-3">
          <ol className="relative space-y-5 pl-4">
            <span
              aria-hidden
              className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-border"
            />
            {rows.map((item) => (
              <li key={item.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-4 top-1 h-2 w-2 rounded-full ring-4 ring-card",
                    TYPE_DOT[item.type],
                  )}
                />
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{item.actor}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>{" "}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {relativeTime(item.timestamp)}
                </p>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

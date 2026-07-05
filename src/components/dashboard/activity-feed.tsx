"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection } from "@/hooks/use-collection";
import { relativeTime, cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/db/types";

const ACTION_DOT: Record<AuditLog["action"], string> = {
  create: "bg-success",
  update: "bg-primary",
  delete: "bg-destructive",
  verify: "bg-secondary",
  login: "bg-muted-foreground",
  settings: "bg-muted-foreground",
};

export function ActivityFeed({ limit }: { limit?: number }) {
  const { items } = useCollection("audit");
  const rows = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Latest actions across your operation
        </p>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {rows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted-foreground">
            No activity yet. Actions you take will appear here.
          </p>
        ) : (
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
                      ACTION_DOT[item.action],
                    )}
                  />
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{item.actorName}</span>{" "}
                    <span className="text-muted-foreground">{item.summary}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {relativeTime(item.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

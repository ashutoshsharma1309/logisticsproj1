"use client";

import Link from "next/link";
import { Blocks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { relativeTime } from "@/lib/utils";
import type { LedgerBlock } from "@/lib/db/types";

export function MissionTimeline({ blocks }: { blocks: LedgerBlock[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Blocks className="h-4 w-4 text-primary" /> Ledger Activity
        </CardTitle>
        <Link href="/dashboard/ledger" className="text-xs font-medium text-primary hover:underline">
          View ledger
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {blocks.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            No ledger blocks yet. Blocks are minted as shipments are created and progress.
          </p>
        ) : (
          <ol className="relative space-y-4 pl-1">
            {blocks.map((b, i) => (
              <li key={b.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold tabular-nums text-primary">
                    {b.blockIndex}
                  </span>
                  {i < blocks.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{b.action}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-foreground/70">{b.shipmentRef}</span>
                    <HashBadge value={b.hash} label="HASH" lead={6} tail={4} copyable={false} />
                    <span>·</span>
                    <span>{relativeTime(b.timestamp)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

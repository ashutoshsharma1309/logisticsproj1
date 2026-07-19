"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HealthResult } from "@/lib/health/score";

function toneFor(score: number | null): { ring: string; text: string; chip: string } {
  if (score === null) return { ring: "stroke-muted-foreground/40", text: "text-muted-foreground", chip: "bg-muted text-muted-foreground" };
  if (score >= 80) return { ring: "stroke-success", text: "text-success", chip: "bg-success/15 text-success" };
  if (score >= 70) return { ring: "stroke-secondary", text: "text-secondary", chip: "bg-secondary/15 text-secondary" };
  if (score >= 55) return { ring: "stroke-warning", text: "text-warning", chip: "bg-warning/15 text-warning" };
  return { ring: "stroke-destructive", text: "text-destructive", chip: "bg-destructive/15 text-destructive" };
}

function barTone(v: number): string {
  if (v >= 80) return "bg-success";
  if (v >= 70) return "bg-secondary";
  if (v >= 55) return "bg-warning";
  return "bg-destructive";
}

export function HealthRing({ health, className }: { health: HealthResult; className?: string }) {
  const { score, grade, subscores } = health;
  const tone = toneFor(score);
  const r = 52;
  const C = 2 * Math.PI * r;
  const pct = score ?? 0;
  const offset = C * (1 - pct / 100);

  return (
    <Card className={cn("flex flex-col gap-6 p-6 sm:flex-row sm:items-center", className)}>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              className={cn("transition-[stroke-dashoffset] duration-700 ease-out", tone.ring)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums", tone.text)}>
              {score ?? "—"}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Health</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold",
              tone.chip,
            )}
          >
            {grade}
          </span>
          <p className="text-sm font-semibold">Operational Health</p>
          <p className="max-w-[15rem] text-xs text-muted-foreground">
            {score === null
              ? "Add shipments, fleet and warehouses to compute a live health grade."
              : "Composite of reliability, stability, capacity, fleet and ledger integrity."}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 sm:border-l sm:border-border sm:pl-6">
        {subscores.map((s) => (
          <div key={s.key} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3">
            <span className="truncate text-xs text-muted-foreground">{s.label}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              {s.value !== null && (
                <div
                  className={cn("h-full rounded-full transition-all duration-700", barTone(s.value))}
                  style={{ width: `${s.value}%` }}
                />
              )}
            </div>
            <span className="text-right text-xs font-semibold tabular-nums text-foreground/80">
              {s.value === null ? "—" : s.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

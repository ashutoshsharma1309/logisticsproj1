import { Badge } from "@/components/ui/badge";
import { STATUS_META, RISK_META } from "@/config/status";
import { cn } from "@/lib/utils";
import type { ShipmentStatus, RiskLevel } from "@/types";

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label} Risk
    </Badge>
  );
}

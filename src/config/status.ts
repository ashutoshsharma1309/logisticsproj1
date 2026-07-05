import type { ShipmentStatus, RiskLevel, TransportMode } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

export const STATUS_META: Record<
  ShipmentStatus,
  { label: string; variant: Variant; dot: string }
> = {
  pending: { label: "Pending", variant: "muted", dot: "bg-muted-foreground" },
  in_transit: { label: "In Transit", variant: "default", dot: "bg-primary" },
  at_warehouse: { label: "At Warehouse", variant: "secondary", dot: "bg-secondary" },
  customs: { label: "Customs", variant: "warning", dot: "bg-warning" },
  out_for_delivery: { label: "Out for Delivery", variant: "accent", dot: "bg-accent" },
  delivered: { label: "Delivered", variant: "success", dot: "bg-success" },
  delayed: { label: "Delayed", variant: "warning", dot: "bg-warning" },
  exception: { label: "Exception", variant: "destructive", dot: "bg-destructive" },
};

export const RISK_META: Record<RiskLevel, { label: string; variant: Variant }> = {
  low: { label: "Low", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

export const MODE_META: Record<TransportMode, { label: string; icon: string }> = {
  truck: { label: "Truck", icon: "Truck" },
  ship: { label: "Ocean", icon: "Ship" },
  plane: { label: "Air", icon: "Plane" },
  rail: { label: "Rail", icon: "Train" },
};

export function integrityVariant(score: number): Variant {
  if (score >= 99) return "success";
  if (score >= 97) return "secondary";
  return "warning";
}

export function healthColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

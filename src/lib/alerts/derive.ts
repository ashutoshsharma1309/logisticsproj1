import type { Shipment, Warehouse, Vehicle, Driver } from "@/lib/db/types";

/**
 * Derives live operational alerts from the org's real records. Every alert
 * corresponds to an actual, checkable condition — nothing is fabricated. Pure
 * and deterministic (ordered by severity then title) so the Command Center
 * renders a stable, testable feed.
 */

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  href: string;
  icon: string; // lucide icon name
}

export interface AlertInput {
  shipments: Shipment[];
  warehouses: Warehouse[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function deriveAlerts(input: AlertInput): Alert[] {
  const { shipments, warehouses, vehicles, drivers } = input;
  const alerts: Alert[] = [];

  // Shipment exceptions (critical) and delays (warning)
  const exceptions = shipments.filter((s) => s.status === "exception");
  const delayed = shipments.filter((s) => s.status === "delayed");
  if (exceptions.length > 0) {
    alerts.push({
      id: "shipment-exceptions",
      severity: "critical",
      title: `${exceptions.length} shipment${exceptions.length > 1 ? "s" : ""} in exception`,
      body: `Needs immediate intervention: ${exceptions.slice(0, 3).map((s) => s.reference).join(", ")}${exceptions.length > 3 ? "…" : ""}`,
      href: "/dashboard/shipments",
      icon: "AlertOctagon",
    });
  }
  if (delayed.length > 0) {
    alerts.push({
      id: "shipment-delays",
      severity: "warning",
      title: `${delayed.length} shipment${delayed.length > 1 ? "s" : ""} delayed`,
      body: `Running behind schedule: ${delayed.slice(0, 3).map((s) => s.reference).join(", ")}${delayed.length > 3 ? "…" : ""}`,
      href: "/dashboard/shipments",
      icon: "Clock",
    });
  }

  // Warehouse capacity
  for (const w of warehouses) {
    const util = w.capacityUnits > 0 ? (w.usedUnits / w.capacityUnits) * 100 : 0;
    if (util > 100) {
      alerts.push({
        id: `wh-over-${w.id}`,
        severity: "critical",
        title: `${w.name} over capacity`,
        body: `Recorded utilization is ${Math.round(util)}% — inbound will overflow.`,
        href: "/dashboard/warehouses",
        icon: "PackageX",
      });
    } else if (util >= 90) {
      alerts.push({
        id: `wh-high-${w.id}`,
        severity: "warning",
        title: `${w.name} near capacity`,
        body: `At ${Math.round(util)}% utilization — consider diverting inbound volume.`,
        href: "/dashboard/warehouses",
        icon: "Boxes",
      });
    }
  }

  // Fleet maintenance + readiness
  const inMaintenance = vehicles.filter((v) => v.status === "maintenance");
  if (inMaintenance.length > 0) {
    alerts.push({
      id: "fleet-maintenance",
      severity: "warning",
      title: `${inMaintenance.length} vehicle${inMaintenance.length > 1 ? "s" : ""} in maintenance`,
      body: `Reduced fleet availability: ${inMaintenance.slice(0, 3).map((v) => v.plate).join(", ")}${inMaintenance.length > 3 ? "…" : ""}`,
      href: "/dashboard/fleet",
      icon: "Wrench",
    });
  }
  if (vehicles.length > 0) {
    const activeShare = vehicles.filter((v) => v.status === "active").length / vehicles.length;
    if (activeShare < 0.5) {
      alerts.push({
        id: "fleet-low-readiness",
        severity: "warning",
        title: "Fleet readiness below 50%",
        body: `Only ${Math.round(activeShare * 100)}% of vehicles are active and available.`,
        href: "/dashboard/fleet",
        icon: "TruckIcon",
      });
    }
  }

  // Drivers: none available
  if (drivers.length > 0 && drivers.every((d) => d.status !== "available")) {
    alerts.push({
      id: "no-drivers",
      severity: "info",
      title: "No drivers available",
      body: "Every driver is on route or off duty — new dispatches will queue.",
      href: "/dashboard/fleet",
      icon: "UserX",
    });
  }

  // Unbilled delivered shipments (revenue leakage signal)
  // (info-level; only when there are deliveries)
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
  if (deliveredCount >= 5) {
    alerts.push({
      id: "billing-followup",
      severity: "info",
      title: `${deliveredCount} deliveries completed`,
      body: "Review invoicing to ensure completed shipments are billed.",
      href: "/dashboard/customers",
      icon: "ReceiptText",
    });
  }

  return alerts.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.title.localeCompare(b.title),
  );
}

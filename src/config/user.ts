import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Operations Manager",
  warehouse: "Warehouse Staff",
  driver: "Fleet Driver",
  customer: "Customer",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full access to every module, users, and organization settings.",
  manager: "Manage operations, shipments, fleet, and analytics.",
  warehouse: "Manage warehouse inventory and inbound/outbound goods.",
  driver: "View assigned shipments and update delivery status.",
  customer: "Track shipments and view invoices.",
};

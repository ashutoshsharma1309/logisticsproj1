import type { User } from "@/types";

/** Demo authenticated user for the dashboard experience. */
export const DEMO_USER: User = {
  id: "usr_admin",
  name: "Alex Rivera",
  email: "alex@chainroute.ai",
  role: "admin",
  avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
  company: "ChainRoute AI",
  status: "active",
  lastActive: "2026-07-04T11:40:00.000Z",
};

export const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrator",
  manager: "Operations Manager",
  warehouse: "Warehouse Staff",
  driver: "Fleet Driver",
  customer: "Customer",
};

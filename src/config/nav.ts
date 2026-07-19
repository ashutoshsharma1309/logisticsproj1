import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  Blocks,
  Radar,
  Globe2,
  BarChart3,
  Users,
  Shield,
  Brain,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const DASHBOARD_NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "AI Insights", href: "/dashboard/ai", icon: Brain },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Shipments", href: "/dashboard/shipments", icon: Package },
      { title: "Warehouses", href: "/dashboard/warehouses", icon: Boxes },
      { title: "Fleet", href: "/dashboard/fleet", icon: Truck },
    ],
  },
  {
    label: "Decentralized Network",
    items: [
      { title: "Digital Twin", href: "/dashboard/twin", icon: Globe2, badge: "New" },
      { title: "Ledger Explorer", href: "/dashboard/ledger", icon: Blocks },
      { title: "Simulation", href: "/dashboard/simulation", icon: Radar, badge: "Live" },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Customers", href: "/dashboard/customers", icon: Users },
      { title: "Admin", href: "/dashboard/admin", icon: Shield, roles: ["admin"] },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const MARKETING_NAV: { title: string; href: string }[] = [
  { title: "Features", href: "/#features" },
  { title: "Simulation", href: "/#simulation" },
  { title: "AI", href: "/#ai" },
  { title: "Pricing", href: "/pricing" },
  { title: "FAQ", href: "/#faq" },
];

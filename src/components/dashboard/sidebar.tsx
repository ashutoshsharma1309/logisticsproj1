"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { DASHBOARD_NAV } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-collection";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { account } = useAuth();
  const ledger = useCollection("ledger").items;
  const role = account?.role;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
        {DASHBOARD_NAV.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {section.label}
            </p>
            {section.items
              .filter((item) => !item.roles || (role && item.roles.includes(role)))
              .map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-card text-foreground shadow-clay-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badge === "Live" ? "success" : "muted"}
                      className="h-5 px-1.5 text-[10px]"
                    >
                      {item.badge === "Live" && (
                        <span className="mr-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                      )}
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-accent/10 to-secondary/12 p-4 shadow-clay-inset">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Blockchain Sim Mode</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {ledger.length > 0
            ? `Decentralized ledger running in simulation — ${ledger.length} block${ledger.length === 1 ? "" : "s"} verified.`
            : "Ledger simulation ready. Blocks are minted as your shipments progress."}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs font-medium text-success">Network healthy</span>
        </div>
      </div>
    </div>
  );
}

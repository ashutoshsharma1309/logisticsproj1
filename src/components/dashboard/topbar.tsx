"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEMO_USER, ROLE_LABELS } from "@/config/user";
import { initials, relativeTime } from "@/lib/utils";
import { toast } from "sonner";

const NOTIFICATIONS = [
  { id: 1, title: "Ledger anomaly flagged", body: "CR-2026034 integrity dropped to 96.2", time: "2026-07-04T10:12:00Z", unread: true },
  { id: 2, title: "Newark hub nearing capacity", body: "Projected 97% utilization in 3 days", time: "2026-07-04T08:40:00Z", unread: true },
  { id: 3, title: "Shipment delivered", body: "CR-2026007 delivered to São Paulo", time: "2026-07-03T22:05:00Z", unread: false },
];

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/ledger?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile menu */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="clay" size="icon-sm" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-full max-w-[280px] translate-x-0 translate-y-0 rounded-none rounded-r-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Navigation</DialogTitle>
          </DialogHeader>
          <SidebarNav />
        </DialogContent>
      </Dialog>

      <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shipments, blocks, hashes…"
          className="pl-10"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </form>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="clay" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="destructive" className="h-5">2 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[10px] text-muted-foreground/70">{relativeTime(n.time)}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/ai" className="justify-center text-sm font-medium text-primary">
                View all insights
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-muted/60">
              <Avatar className="h-8 w-8">
                <AvatarImage src={DEMO_USER.avatar} alt={DEMO_USER.name} />
                <AvatarFallback>{initials(DEMO_USER.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold leading-none">{DEMO_USER.name}</span>
                <span className="block text-[11px] text-muted-foreground">{ROLE_LABELS[DEMO_USER.role]}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{DEMO_USER.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{DEMO_USER.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings"><UserIcon className="mr-1" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings"><Settings className="mr-1" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast.success("Signed out (demo)");
                router.push("/");
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-1" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

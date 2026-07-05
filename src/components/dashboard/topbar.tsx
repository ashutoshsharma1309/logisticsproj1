"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { openCommandPalette } from "@/hooks/use-hotkey";
import { ROLE_LABELS } from "@/config/user";
import { initials, relativeTime } from "@/lib/utils";
import { toast } from "sonner";

export function Topbar() {
  const router = useRouter();
  const { account, org, signOut } = useAuth();
  const { items, unread, markRead, markAllRead } = useNotifications();

  const name = account?.name ?? "";
  const email = account?.email ?? "";

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-6">
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

      {/* Command palette trigger */}
      <button
        onClick={openCommandPalette}
        className="relative hidden max-w-md flex-1 items-center gap-3 rounded-xl bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground shadow-clay-inset transition-colors hover:bg-muted sm:flex"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <span className="hidden items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-clay-inset md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
          Simulation Mode
        </span>

        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="clay" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unread > 0 ? (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                You're all caught up. Activity will appear here as you use ChainRoute.
              </div>
            ) : (
              items.slice(0, 6).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    if (n.href) router.push(n.href);
                  }}
                  className="flex flex-col items-start gap-0.5 py-2.5"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {relativeTime(n.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-muted/60">
              <Avatar className="h-8 w-8">
                {account?.avatar ? <AvatarImage src={account.avatar} alt={name} /> : null}
                <AvatarFallback>{name ? initials(name) : "CR"}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold leading-none">{name || "Account"}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {account ? ROLE_LABELS[account.role] : org?.name}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{name || "Account"}</p>
              <p className="text-xs font-normal text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <UserIcon className="mr-1" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-1" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
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

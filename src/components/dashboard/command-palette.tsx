"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DASHBOARD_NAV } from "@/config/nav";
import { useHotkey, OPEN_COMMAND_EVENT } from "@/hooks/use-hotkey";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { signOut } = useAuth();

  useHotkey("mod+k", (e) => {
    e.preventDefault();
    setOpen((o) => !o);
  });

  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_COMMAND_EVENT, handler);
    return () => window.removeEventListener(OPEN_COMMAND_EVENT, handler);
  }, []);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const commands = React.useMemo<Command[]>(() => {
    const nav: Command[] = DASHBOARD_NAV.flatMap((s) =>
      s.items.map((item) => ({
        id: `nav-${item.href}`,
        label: item.title,
        group: "Navigate",
        icon: <item.icon className="h-4 w-4" />,
        keywords: s.label,
        run: () => go(item.href),
      })),
    );
    const actions: Command[] = [
      { id: "new-shipment", label: "New shipment", href: "/dashboard/shipments?new=1" },
      { id: "new-warehouse", label: "New warehouse", href: "/dashboard/warehouses?new=1" },
      { id: "new-vehicle", label: "New vehicle", href: "/dashboard/fleet?new=1" },
      { id: "new-driver", label: "New driver", href: "/dashboard/fleet?new=driver" },
      { id: "new-customer", label: "New customer", href: "/dashboard/customers?new=1" },
    ].map((a) => ({
      id: a.id,
      label: a.label,
      group: "Create",
      icon: <Plus className="h-4 w-4" />,
      run: () => go(a.href),
    }));
    const system: Command[] = [
      {
        id: "toggle-theme",
        label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`,
        group: "System",
        icon: resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          setOpen(false);
        },
      },
      {
        id: "sign-out",
        label: "Sign out",
        group: "System",
        icon: <LogOut className="h-4 w-4" />,
        run: () => {
          setOpen(false);
          signOut();
          router.push("/login");
        },
      },
    ];
    return [...actions, ...nav, ...system];
  }, [go, resolvedTheme, setTheme, signOut, router]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q),
    );
  }, [commands, query]);

  React.useEffect(() => setActive(0), [query]);
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search and jump to any page or run a quick action.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-border/60 px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No commands found for “{query}”.
            </p>
          )}
          {groups.map((group) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {group}
              </p>
              {filtered
                .filter((c) => c.group === group)
                .map((c) => {
                  const idx = filtered.indexOf(c);
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => c.run()}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        active === idx ? "bg-muted text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className="text-muted-foreground">{c.icon}</span>
                      <span className="flex-1 text-left text-foreground">{c.label}</span>
                      {active === idx && <ArrowRight className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

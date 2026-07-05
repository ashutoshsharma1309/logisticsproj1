"use client";

import * as React from "react";
import { ShieldCheck, Boxes, Route, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { FadeIn, motion } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

interface ValueProp {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: ShieldCheck,
    title: "Tamper-proof shipment ledger",
    body: "Every hand-off is hashed, signed and confirmed across the simulated chain — no more disputed custody.",
  },
  {
    icon: Route,
    title: "Live multimodal routing",
    body: "Watch air, sea and road lanes rebalance in real time as risk and demand shift across your network.",
  },
  {
    icon: TrendingUp,
    title: "AI forecasts that pay for themselves",
    body: "Delay probability, fuel burn and revenue projections surface savings before they slip away.",
  },
  {
    icon: Boxes,
    title: "One control tower, every asset",
    body: "Warehouses, fleets, drivers and invoices unified into a single Series-A grade command center.",
  },
];

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % VALUE_PROPS.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const current = VALUE_PROPS[active];
  const CurrentIcon = current.icon;

  return (
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Theme toggle — top right on every viewport */}
      <div className="absolute right-4 top-4 z-30 lg:right-6 lg:top-6">
        <ThemeToggle />
      </div>

      {/* Left brand panel — hidden on mobile */}
      <aside className="relative hidden w-full max-w-[46%] flex-col justify-between overflow-hidden bg-mesh p-10 xl:p-14 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-clay-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Blockchain Simulation Mode
          </span>

          <div className="min-h-[168px]">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="clay-lg max-w-md bg-card/75 p-6 backdrop-blur"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-clay-sm">
                <CurrentIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                {current.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {current.body}
              </p>
            </motion.div>
          </div>

          <div className="flex items-center gap-2" role="tablist" aria-label="Highlights">
            {VALUE_PROPS.map((prop, index) => (
              <button
                key={prop.title}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={prop.title}
                onClick={() => setActive(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === active
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Trusted simulation for 40+ logistics operators worldwide
        </div>
      </aside>

      {/* Right content panel */}
      <main className="flex w-full flex-1 items-center justify-center bg-background px-5 py-12 sm:px-8">
        <FadeIn className="w-full max-w-md" y={16}>
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <div className="clay-lg bg-card p-7 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </FadeIn>
      </main>
    </div>
  );
}

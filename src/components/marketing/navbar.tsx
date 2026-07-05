"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { MARKETING_NAV } from "@/config/nav";
import { cn } from "@/lib/utils";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
          scrolled ? "bg-card/80 shadow-clay backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="gradient" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/signup">Start free</Link>
          </Button>
          <Button
            variant="clay"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[68px] w-[calc(100%-2rem)] max-w-6xl rounded-2xl bg-card p-4 shadow-clay-lg lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {MARKETING_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  {item.title}
                </Link>
              ))}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="gradient" className="flex-1" asChild>
                  <Link href="/signup">Start free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

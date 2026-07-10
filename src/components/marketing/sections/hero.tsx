"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/shared/metric-card";

const HERO_STATS = [
  { label: "Shipments tracked", value: 2400000, suffix: "+" },
  { label: "Ledger integrity", value: 99.98, suffix: "%", decimals: 2 },
  { label: "Avg. delay reduction", value: 34, suffix: "%" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      {/* Calm, engineered backdrop — one soft brand wash + a fine masked grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dot-grid opacity-70 [mask-image:radial-gradient(ellipse_62%_50%_at_50%_0%,black,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] shadow-clay-sm"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="h-2.5 w-2.5 text-primary" />
          </span>
          <span className="font-medium">Blockchain Simulation Mode</span>
          <span className="text-muted-foreground">· decentralized by design</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
        >
          The <span className="text-gradient">decentralized</span> brain for modern logistics
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
        >
          ChainRoute AI turns every shipment event into an immutable ledger entry, predicts
          delays before they happen, and gives your supply chain enterprise-grade transparency —
          all in one beautifully simple platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button variant="gradient" size="lg" asChild className="group">
            <Link href="/signup">
              Start free — no card
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="clay" size="lg" asChild>
            <Link href="/dashboard">
              <Zap className="text-primary" /> Explore live demo
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> SOC 2 aligned</span>
          <span className="flex items-center gap-1.5"><Boxes className="h-3.5 w-3.5 text-primary" /> 60-node simulated network</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-warning" /> Deploys on Vercel</span>
        </motion.div>
      </div>

      {/* Hero stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 px-6 sm:grid-cols-3"
      >
        {HERO_STATS.map((s) => (
          <div key={s.label} className="clay p-6 text-center">
            <p className="text-3xl font-bold tracking-tight text-gradient">
              <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

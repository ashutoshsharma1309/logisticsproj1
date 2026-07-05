"use client";

import { motion } from "framer-motion";

const COMPANIES = [
  "NordFreight",
  "Aether Cargo",
  "Meridian Ship",
  "Polaris Supply",
  "Ironclad Haul",
  "Zenith Distribution",
  "Continental Lines",
  "Vanguard Logistics",
];

export function Logos() {
  const row = [...COMPANIES, ...COMPANIES];

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Powering supply chains at
        </p>

        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <motion.div
            className="flex w-max items-center gap-12 sm:gap-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {row.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="select-none whitespace-nowrap text-xl font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground sm:text-2xl"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

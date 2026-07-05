"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FadeIn } from "@/components/shared/motion";

interface QA {
  question: string;
  answer: string;
}

const FAQS: QA[] = [
  {
    question: "Is ChainRoute a real blockchain?",
    answer:
      "No. ChainRoute runs a Blockchain Simulation Mode — a deterministic model of a distributed ledger. Each event is hashed and linked to the previous block with a signature and verifier, giving you tamper-evident, replayable history without any real chain, tokens or gas fees.",
  },
  {
    question: "How is my data secured?",
    answer:
      "Data is encrypted in transit and at rest, access is governed by role-based permissions, and every ledger event carries a cryptographic integrity score. Our controls are aligned with SOC 2 practices so you always know who touched what, and when.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "Our delay, risk and cost models typically report 88–96% confidence, and every recommendation ships with its confidence score and the factors behind it. You stay in control — the AI suggests, you decide.",
  },
  {
    question: "Does ChainRoute integrate with my existing tools?",
    answer:
      "Yes. Business and Enterprise plans connect to your TMS, ERP and carrier APIs, and Enterprise adds custom integrations and dedicated verifier nodes so ChainRoute fits the stack you already run.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Start on the free Starter plan with no card required. Business is a flat $149/month with unlimited shipments and full AI, while Enterprise is custom-priced for global fleets. No gas fees, no per-transaction charges, no lock-in.",
  },
  {
    question: "What does onboarding look like?",
    answer:
      "Most teams are live in under an hour: create an account, spin up a simulated network and connect your first data source. Enterprise customers get white-glove onboarding and a dedicated success engineer.",
  },
  {
    question: "Can I deploy ChainRoute on Vercel?",
    answer:
      "Absolutely. ChainRoute is built on Next.js and deploys to Vercel out of the box — push to your repository and your instance is live on the edge in minutes, with previews for every branch.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Questions, answered
          </h2>
        </FadeIn>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <div key={faq.question} className="clay overflow-hidden">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="text-base font-semibold">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground shadow-clay-inset"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-pretty text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

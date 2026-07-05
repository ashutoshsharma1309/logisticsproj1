import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/motion";

export function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="clay-lg relative overflow-hidden bg-mesh px-6 py-16 text-center sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Bring <span className="text-gradient">decentralized trust</span> to your supply
                chain today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
                Start free in minutes, no card required. See immutable ledgers, predictive AI and
                a live network simulation working for your operation.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="gradient" size="lg" asChild className="group">
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="clay" size="lg" asChild>
                  <Link href="/contact">
                    <PhoneCall className="text-primary" /> Talk to sales
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

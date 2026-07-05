import {
  Blocks,
  BrainCircuit,
  Route,
  Warehouse,
  HeartPulse,
  ShieldAlert,
  BadgeCheck,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Blocks,
    title: "Immutable Ledger",
    description:
      "Every scan, hand-off and status change is hashed into a tamper-evident chain — a full, verifiable audit trail for each shipment.",
  },
  {
    icon: BrainCircuit,
    title: "AI Delay Prediction",
    description:
      "Models weigh weather, congestion and carrier history to flag at-risk shipments hours before they slip their ETA.",
  },
  {
    icon: Route,
    title: "Route Optimization",
    description:
      "Continuously re-plans multi-modal routes for cost, carbon and time, adapting the moment conditions change.",
  },
  {
    icon: Warehouse,
    title: "Warehouse Visibility",
    description:
      "Live utilization, zone heatmaps and inbound/outbound flow across every facility in your network.",
  },
  {
    icon: HeartPulse,
    title: "Fleet Health",
    description:
      "Per-vehicle health scores, fuel and service intervals surface maintenance before it becomes downtime.",
  },
  {
    icon: ShieldAlert,
    title: "Anomaly Detection",
    description:
      "Statistical baselines catch route deviations, integrity dips and unexpected dwell time in real time.",
  },
  {
    icon: BadgeCheck,
    title: "Transporter Trust Score",
    description:
      "On-time rate, verification history and ledger integrity roll up into a single trust score per carrier.",
  },
  {
    icon: Radar,
    title: "Live Simulation",
    description:
      "Model your network on an interactive world map and watch blocks mint as simulated shipments move.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Platform
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            One control plane for your entire{" "}
            <span className="text-gradient">supply chain</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From immutable audit trails to predictive AI, ChainRoute unifies every layer of
            logistics into a single, beautifully simple platform.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <Card className="clay-interactive h-full p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}

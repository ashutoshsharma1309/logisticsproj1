import Link from "next/link";
import { Boxes, MapPin, Radio, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/shared/motion";
import { WorldMap } from "@/components/map/world-map";
import { getSimNodes, getSimRoutes } from "@/services/simulation";
import { getStore } from "@/services/store";
import { formatNumber } from "@/lib/utils";

export function SimulationPreview() {
  const nodes = getSimNodes();
  const routes = getSimRoutes(6);
  const blocksMinted = getStore().ledger.length;

  const stats = [
    { icon: MapPin, label: "Network nodes", value: formatNumber(nodes.length) },
    { icon: RouteIcon, label: "Active routes", value: formatNumber(routes.length) },
    { icon: Boxes, label: "Blocks minted", value: formatNumber(blocksMinted) },
  ];

  return (
    <section id="simulation" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Radio className="h-3.5 w-3.5" /> Interactive
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Watch your network move on a{" "}
            <span className="text-gradient">live world map</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Spin up a simulated logistics network, press play and watch shipments travel between
            hubs while the ledger mints a new block for every event.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          <div className="clay-lg relative overflow-hidden p-3 sm:p-4">
            <WorldMap
              nodes={nodes}
              routes={routes}
              className="h-[420px] bg-card/40"
            />

            {/* stat chips */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-7">
              <div className="flex flex-wrap gap-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="glass flex items-center gap-2.5 rounded-xl px-3.5 py-2 shadow-clay-sm"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold leading-none tabular-nums">{stat.value}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="glass rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-clay-sm">
                Blockchain Simulation Mode
              </span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-8 flex justify-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/dashboard/simulation">Open full simulator</Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

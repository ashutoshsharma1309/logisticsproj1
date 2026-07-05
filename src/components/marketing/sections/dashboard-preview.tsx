import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/shared/motion";
import { MetricCard } from "@/components/shared/metric-card";
import { AreaTrend } from "@/components/charts";
import { getKpis, getDeliveryTrend } from "@/services/analytics";

export function DashboardPreview() {
  const kpis = getKpis().slice(0, 3);
  const trend = getDeliveryTrend();

  return (
    <section id="dashboard" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4">
            <LayoutDashboard className="h-3.5 w-3.5" /> Analytics
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Every metric that matters, in{" "}
            <span className="text-gradient">one glance</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            A real-time analytics workspace for cargo value, deliveries, fleet health and the
            forecasts that keep you ahead of disruption.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          {/* browser frame */}
          <div className="clay-lg overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <div className="mx-auto flex items-center rounded-lg bg-card px-4 py-1 text-xs text-muted-foreground shadow-clay-inset">
                app.chainroute.ai/dashboard
              </div>
            </div>

            <div className="bg-mesh p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {kpis.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </div>

              <Card className="mt-4 p-5">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Delivery volume vs. forecast</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <AreaTrend
                    data={trend}
                    height={240}
                    series={[
                      { key: "delivered", label: "Delivered" },
                      {
                        key: "forecast",
                        label: "Forecast",
                        color: "hsl(var(--secondary))",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-8 flex justify-center">
          <Button variant="clay" size="lg" asChild className="group">
            <Link href="/dashboard">
              Explore the dashboard
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

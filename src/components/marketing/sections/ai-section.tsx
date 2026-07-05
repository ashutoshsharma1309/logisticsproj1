import {
  AlertTriangle,
  Boxes,
  Clock,
  DollarSign,
  HeartPulse,
  Route,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FadeIn } from "@/components/shared/motion";

interface Capability {
  icon: LucideIcon;
  title: string;
  confidence: number;
}

const CAPABILITIES: Capability[] = [
  { icon: Clock, title: "Delay Prediction", confidence: 96 },
  { icon: Route, title: "Route Suggestions", confidence: 93 },
  { icon: ShieldAlert, title: "Risk Prediction", confidence: 91 },
  { icon: Warehouse, title: "Warehouse Optimization", confidence: 89 },
  { icon: TrendingUp, title: "Demand Forecast", confidence: 88 },
  { icon: DollarSign, title: "Cost Prediction", confidence: 92 },
  { icon: HeartPulse, title: "Health Score", confidence: 95 },
  { icon: AlertTriangle, title: "Fraud Detection", confidence: 90 },
];

export function AiSection() {
  return (
    <section id="ai" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left: capabilities */}
        <FadeIn>
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3.5 w-3.5" /> ChainRoute Intelligence
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            An <span className="text-gradient">AI engine</span> that never stops thinking
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Eight specialized models score every shipment, route and facility in real time — each
            surfacing a confident, explainable recommendation you can act on.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="clay-sm flex items-center gap-3 rounded-xl p-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent shadow-clay-inset">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{cap.title}</span>
                  <Badge variant="success" className="tabular-nums">
                    {cap.confidence}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Right: AI insight panel */}
        <FadeIn delay={0.1}>
          <Card className="relative overflow-hidden p-1">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-clay-sm">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">AI Insight</CardTitle>
                    <CardDescription>Generated 2 minutes ago</CardDescription>
                  </div>
                </div>
                <Badge variant="warning">
                  <AlertTriangle className="h-3.5 w-3.5" /> High impact
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl bg-muted/50 p-4 shadow-clay-inset">
                <p className="text-sm font-semibold">
                  Reroute 3 critical shipments through the Rotterdam hub
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Congestion at Hamburg is forecast to add 14 hours of dwell time. Diverting via
                  Rotterdam avoids the bottleneck and protects three express SLAs.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model confidence</span>
                  <span className="font-semibold text-foreground">94%</span>
                </div>
                <Progress value={94} />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-success/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
                    <DollarSign className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Projected savings</p>
                    <p className="text-lg font-bold text-success tabular-nums">$18,400</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" /> 3 shipments
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}

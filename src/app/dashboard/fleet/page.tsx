"use client";

import * as React from "react";
import {
  Truck,
  Plus,
  Fuel,
  Zap,
  Atom,
  Star,
  Wrench,
  Gauge,
  Activity,
  ShieldCheck,
  Clock,
  MoreHorizontal,
  UserPlus,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AreaTrend, DonutChart, RadialGauge } from "@/components/charts";
import { getStore } from "@/services/store";
import { getFuelTrend } from "@/services/analytics";
import { healthColor } from "@/config/status";
import { formatNumber, formatCompact, cn, initials } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";
import type { Vehicle, Driver } from "@/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const SERVICE_THRESHOLD_KM = 2000;

const VEHICLE_STATUS_META: Record<Vehicle["status"], { label: string; variant: Variant }> = {
  active: { label: "Active", variant: "success" },
  idle: { label: "Idle", variant: "muted" },
  maintenance: { label: "Maintenance", variant: "warning" },
  charging: { label: "Charging", variant: "accent" },
};

const DRIVER_STATUS_META: Record<Driver["status"], { label: string; variant: Variant }> = {
  on_route: { label: "On Route", variant: "default" },
  available: { label: "Available", variant: "success" },
  off_duty: { label: "Off Duty", variant: "muted" },
  resting: { label: "Resting", variant: "warning" },
};

const FUEL_META: Record<
  Vehicle["fuelType"],
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  diesel: { label: "Diesel", icon: Fuel, className: "text-warning" },
  electric: { label: "Electric", icon: Zap, className: "text-success" },
  hydrogen: { label: "Hydrogen", icon: Atom, className: "text-secondary" },
};

const VEHICLE_TYPE_LABEL: Record<Vehicle["type"], string> = {
  semi: "Semi",
  box_truck: "Box Truck",
  van: "Van",
  reefer: "Reefer",
};

function serviceDue(v: Vehicle): boolean {
  return v.nextServiceKm - v.odometerKm < SERVICE_THRESHOLD_KM;
}

function fuelIndicator(level: number): string {
  if (level < 20) return "bg-gradient-to-r from-destructive to-warning";
  if (level < 45) return "bg-gradient-to-r from-warning to-accent";
  return "bg-gradient-to-r from-primary to-accent";
}

function trustColor(score: number): string {
  if (score >= 90) return "hsl(var(--success))";
  if (score >= 80) return "hsl(var(--primary))";
  return "hsl(var(--warning))";
}

/** Inline star rating (0-5). */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "text-muted-foreground/40",
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

interface KpiTile {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function FleetPage() {
  const { vehicles, drivers } = getStore();
  const fuelTrend = React.useMemo(() => getFuelTrend(), []);

  const [status, setStatus] = React.useState<string>("all");

  const filteredVehicles = React.useMemo(
    () => (status === "all" ? vehicles : vehicles.filter((v) => v.status === status)),
    [vehicles, status],
  );

  const serviceAlerts = React.useMemo(
    () =>
      vehicles
        .filter(serviceDue)
        .sort((a, b) => a.nextServiceKm - a.odometerKm - (b.nextServiceKm - b.odometerKm)),
    [vehicles],
  );

  const kpis: KpiTile[] = React.useMemo(() => {
    const active = vehicles.filter((v) => v.status === "active").length;
    const inMaint = vehicles.filter((v) => v.status === "maintenance").length;
    const avgHealth = Math.round(
      vehicles.reduce((a, v) => a + v.healthScore, 0) / vehicles.length,
    );
    const avgEff =
      Math.round((vehicles.reduce((a, v) => a + v.efficiencyMpg, 0) / vehicles.length) * 10) / 10;
    return [
      {
        label: "Active Vehicles",
        value: `${active}`,
        sub: `of ${vehicles.length} in fleet`,
        icon: Truck,
      },
      {
        label: "Avg Fleet Health",
        value: `${avgHealth}%`,
        sub: "diagnostic index",
        icon: Activity,
      },
      {
        label: "Avg Efficiency",
        value: `${avgEff} mpg`,
        sub: "energy equivalent",
        icon: Gauge,
      },
      {
        label: "In Maintenance",
        value: `${inMaint}`,
        sub: `${serviceAlerts.length} due soon`,
        icon: Wrench,
      },
    ];
  }, [vehicles, serviceAlerts]);

  const driverById = React.useMemo(() => {
    const map = new Map<string, Driver>();
    for (const d of drivers) map.set(d.id, d);
    return map;
  }, [drivers]);

  const driverStatusData = React.useMemo(() => {
    const order: Driver["status"][] = ["on_route", "available", "resting", "off_duty"];
    return order.map((s) => ({
      label: DRIVER_STATUS_META[s].label,
      value: drivers.filter((d) => d.status === s).length,
    }));
  }, [drivers]);

  const availableCount = drivers.filter((d) => d.status === "available").length;
  const onRouteCount = drivers.filter((d) => d.status === "on_route").length;

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Fleet Management"
          description="Vehicle telemetry, driver trust scores and predictive maintenance across your transport network."
        >
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[168px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="gradient"
            onClick={() => toast.success("Add vehicle", { description: "Onboarding flow coming soon." })}
          >
            <Plus className="h-4 w-4" />
            Add vehicle
          </Button>
        </PageHeader>
      </FadeIn>

      {/* KPI row */}
      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <StaggerItem key={k.label}>
              <Card className="p-5 clay-interactive">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.sub}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="fuel">Fuel &amp; Maintenance</TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------- Vehicles */}
        <TabsContent value="vehicles">
          <FadeIn>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Fleet Vehicles</CardTitle>
                  <CardDescription>
                    {filteredVehicles.length} vehicles · rows flagged when service is under{" "}
                    {formatNumber(SERVICE_THRESHOLD_KM)} km away.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plate</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fuel</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead className="text-right">Odometer</TableHead>
                        <TableHead className="text-right">Util.</TableHead>
                        <TableHead>Next service</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.map((v) => {
                        const due = serviceDue(v);
                        const Fi = FUEL_META[v.fuelType].icon;
                        const remaining = v.nextServiceKm - v.odometerKm;
                        return (
                          <TableRow
                            key={v.id}
                            className={cn(due && "bg-warning/5")}
                          >
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                {v.plate}
                                {due && (
                                  <Badge variant="warning" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Service due
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{v.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{VEHICLE_TYPE_LABEL[v.type]}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={VEHICLE_STATUS_META[v.status].variant}>
                                {VEHICLE_STATUS_META[v.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Fi
                                  className={cn("h-4 w-4 shrink-0", FUEL_META[v.fuelType].className)}
                                />
                                <div className="w-24">
                                  <Progress
                                    value={v.fuelLevel}
                                    className="h-1.5"
                                    indicatorClassName={fuelIndicator(v.fuelLevel)}
                                  />
                                </div>
                                <span className="w-8 text-xs tabular-nums text-muted-foreground">
                                  {v.fuelLevel}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={cn("font-semibold tabular-nums", healthColor(v.healthScore))}>
                                {v.healthScore}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatNumber(v.odometerKm)} km
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{v.utilization}%</TableCell>
                            <TableCell>
                              <span className={cn("text-sm tabular-nums", due ? "text-warning" : "text-muted-foreground")}>
                                {formatNumber(remaining)} km
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${v.plate}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{v.plate}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      toast.success("Assign driver", {
                                        description: `Open driver assignment for ${v.plate}.`,
                                      })
                                    }
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    Assign driver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      toast.success("Service scheduled", {
                                        description: `Maintenance booked for ${v.plate}.`,
                                      })
                                    }
                                  >
                                    <CalendarClock className="h-4 w-4" />
                                    Schedule service
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* -------------------------------------------------- Drivers */}
        <TabsContent value="drivers">
          <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {drivers.map((d) => {
              const meta = DRIVER_STATUS_META[d.status];
              return (
                <StaggerItem key={d.id}>
                  <Card className="flex h-full flex-col p-5 clay-interactive">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 shadow-clay-sm">
                          <AvatarImage src={d.avatar} alt={d.name} />
                          <AvatarFallback>{initials(d.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold leading-tight">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.license}</p>
                        </div>
                      </div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>

                    <div className="mt-3">
                      <Stars rating={d.rating} />
                    </div>

                    {/* Trust score — decentralized trust showcase */}
                    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
                      <RadialGauge
                        value={d.trustScore}
                        size={92}
                        color={trustColor(d.trustScore)}
                        label="Trust"
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5 text-success" />
                          Decentralized Trust Score
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Consensus-weighted reputation from verified delivery attestations.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                        <p className="text-sm font-semibold">{formatCompact(d.deliveries)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Deliveries
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                        <p className="text-sm font-semibold text-success">{d.onTimeRate}%</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          On-time
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-2 shadow-clay-inset">
                        <p className="flex items-center justify-center gap-1 text-sm font-semibold">
                          <Clock className="h-3 w-3" />
                          {d.hoursThisWeek}h
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          This week
                        </p>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </TabsContent>

        {/* -------------------------------------------------- Fuel & Maintenance */}
        <TabsContent value="fuel">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <FadeIn className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Fuel Consumption</CardTitle>
                  <CardDescription>
                    Energy draw by powertrain across the fleet (indexed units).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AreaTrend
                    data={fuelTrend}
                    height={300}
                    series={[
                      { key: "diesel", label: "Diesel", color: "hsl(var(--warning))" },
                      { key: "electric", label: "Electric", color: "hsl(var(--success))" },
                      { key: "hydrogen", label: "Hydrogen", color: "hsl(var(--secondary))" },
                    ]}
                  />
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.05}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Driver Allocation</CardTitle>
                  <CardDescription>Current status distribution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DonutChart data={driverStatusData} height={200} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-success/10 p-3 text-center shadow-clay-sm">
                      <p className="text-2xl font-bold text-success">{availableCount}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 text-center shadow-clay-sm">
                      <p className="text-2xl font-bold text-primary">{onRouteCount}</p>
                      <p className="text-xs text-muted-foreground">On route</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.1} className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-warning" />
                    Maintenance Alerts
                  </CardTitle>
                  <CardDescription>
                    Vehicles within {formatNumber(SERVICE_THRESHOLD_KM)} km of their next scheduled
                    service.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {serviceAlerts.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-sm text-success shadow-clay-inset">
                      <CheckCircle2 className="h-4 w-4" />
                      All vehicles are within safe service intervals.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {serviceAlerts.map((v) => {
                        const remaining = v.nextServiceKm - v.odometerKm;
                        const driver = v.driverId ? driverById.get(v.driverId) : undefined;
                        return (
                          <div
                            key={v.id}
                            className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{v.plate}</span>
                              <Badge variant="warning" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {formatNumber(remaining)} km
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {v.model} · {VEHICLE_TYPE_LABEL[v.type]} · {v.location}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Health</span>
                              <span className={cn("font-semibold", healthColor(v.healthScore))}>
                                {v.healthScore}%
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Driver: {driver ? driver.name : "Unassigned"}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() =>
                                toast.success("Service scheduled", {
                                  description: `Maintenance booked for ${v.plate}.`,
                                })
                              }
                            >
                              <CalendarClock className="h-4 w-4" />
                              Schedule service
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

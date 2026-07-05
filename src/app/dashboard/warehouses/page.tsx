"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Warehouse as WarehouseIcon,
  Boxes,
  MapPin,
  Gauge,
  Package,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { Field } from "@/components/form/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BarStat } from "@/components/charts";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { warehouseUtilization } from "@/lib/analytics/compute";
import { cn, formatCompact } from "@/lib/utils";
import type { Warehouse } from "@/lib/db/types";

/** Utilization → indicator gradient class, by threshold. */
function utilizationIndicator(value: number): string {
  if (value >= 88) return "bg-gradient-to-r from-warning to-destructive";
  if (value >= 72) return "bg-gradient-to-r from-accent to-warning";
  return "bg-gradient-to-r from-primary to-accent";
}

/** Utilization → text color, by threshold. */
function utilizationText(value: number): string {
  if (value >= 88) return "text-destructive";
  if (value >= 72) return "text-warning";
  return "text-success";
}

function utilizationOf(w: Warehouse): number {
  return w.capacityUnits > 0
    ? Math.round((w.usedUnits / w.capacityUnits) * 100)
    : 0;
}

// ---------------------------------------------------------------- form schema
const warehouseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    code: z.string().trim(),
    addressLine1: z.string().trim(),
    city: z.string().trim(),
    state: z.string().trim(),
    country: z.string().trim(),
    capacityUnits: z
      .number({ invalid_type_error: "Enter a capacity" })
      .positive("Capacity must be greater than 0"),
    usedUnits: z
      .number({ invalid_type_error: "Enter used units" })
      .min(0, "Cannot be negative"),
    serviceAreas: z.string(),
    contactName: z.string().trim(),
    contactPhone: z.string().trim(),
  })
  .refine((d) => d.usedUnits <= d.capacityUnits, {
    message: "Used cannot exceed capacity",
    path: ["usedUnits"],
  });

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

function parseAreas(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Warehouse | null;
  onSubmit: (values: Omit<Warehouse, "id" | "orgId" | "createdAt">) => void;
}

function WarehouseDialog({ open, onOpenChange, initial, onSubmit }: WarehouseDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      addressLine1: "",
      city: "",
      state: "",
      country: "",
      capacityUnits: undefined,
      usedUnits: undefined,
      serviceAreas: "",
      contactName: "",
      contactPhone: "",
    },
  });

  // Sync form to the record being edited whenever the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        name: initial.name,
        code: initial.code,
        addressLine1: initial.addressLine1,
        city: initial.city,
        state: initial.state,
        country: initial.country,
        capacityUnits: initial.capacityUnits,
        usedUnits: initial.usedUnits,
        serviceAreas: initial.serviceAreas.join(", "),
        contactName: initial.contactName,
        contactPhone: initial.contactPhone,
      });
    } else {
      reset({
        name: "",
        code: "",
        addressLine1: "",
        city: "",
        state: "",
        country: "",
        capacityUnits: undefined,
        usedUnits: undefined,
        serviceAreas: "",
        contactName: "",
        contactPhone: "",
      });
    }
  }, [open, initial, reset]);

  const areaPreview = parseAreas(watch("serviceAreas") ?? "");

  const submit = handleSubmit((values) => {
    onSubmit({
      name: values.name,
      code: values.code,
      addressLine1: values.addressLine1,
      city: values.city,
      state: values.state,
      country: values.country,
      capacityUnits: values.capacityUnits,
      usedUnits: values.usedUnits,
      serviceAreas: parseAreas(values.serviceAreas),
      contactName: values.contactName,
      contactPhone: values.contactPhone,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit warehouse" : "Add warehouse"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this facility's capacity, coverage and contact details."
              : "Register a new fulfilment facility on your network."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="wh-name" required error={errors.name?.message}>
              <Input id="wh-name" placeholder="Central Distribution Hub" {...register("name")} />
            </Field>
            <Field label="Code" htmlFor="wh-code" error={errors.code?.message}>
              <Input id="wh-code" placeholder="WH-01" {...register("code")} />
            </Field>
          </div>

          <Field label="Address" htmlFor="wh-address" error={errors.addressLine1?.message}>
            <Input id="wh-address" placeholder="Street address" {...register("addressLine1")} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="wh-city" error={errors.city?.message}>
              <Input id="wh-city" {...register("city")} />
            </Field>
            <Field label="State" htmlFor="wh-state" error={errors.state?.message}>
              <Input id="wh-state" {...register("state")} />
            </Field>
            <Field label="Country" htmlFor="wh-country" error={errors.country?.message}>
              <Input id="wh-country" {...register("country")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Capacity (units)"
              htmlFor="wh-capacity"
              required
              error={errors.capacityUnits?.message}
            >
              <Input
                id="wh-capacity"
                type="number"
                min={1}
                placeholder="10000"
                {...register("capacityUnits", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Used (units)"
              htmlFor="wh-used"
              required
              error={errors.usedUnits?.message}
              hint="Must be ≤ capacity"
            >
              <Input
                id="wh-used"
                type="number"
                min={0}
                placeholder="0"
                {...register("usedUnits", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <Field
            label="Service areas"
            htmlFor="wh-areas"
            hint="Comma-separated"
            error={errors.serviceAreas?.message}
          >
            <Input
              id="wh-areas"
              placeholder="Mumbai, Pune, Nashik"
              {...register("serviceAreas")}
            />
          </Field>
          {areaPreview.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {areaPreview.map((a) => (
                <Badge key={a} variant="secondary">
                  {a}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name" htmlFor="wh-contact" error={errors.contactName?.message}>
              <Input id="wh-contact" {...register("contactName")} />
            </Field>
            <Field label="Contact phone" htmlFor="wh-phone" error={errors.contactPhone?.message}>
              <Input id="wh-phone" {...register("contactPhone")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initial ? "Save changes" : "Add warehouse"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface KpiTile {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

function WarehousesInner() {
  const { items: warehouses, add, edit, remove } = useCollection("warehouses");
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Warehouse | null>(null);
  const [deleting, setDeleting] = React.useState<Warehouse | null>(null);
  const [viewing, setViewing] = React.useState<Warehouse | null>(null);

  // ?new=1 deep-link opens the create dialog on mount.
  React.useEffect(() => {
    if (searchParams.get("new")) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const kpis: KpiTile[] = React.useMemo(() => {
    const count = warehouses.length;
    const totalCapacity = warehouses.reduce((a, w) => a + w.capacityUnits, 0);
    const totalUsed = warehouses.reduce((a, w) => a + w.usedUnits, 0);
    const avgUtil =
      totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
    return [
      {
        label: "Warehouses",
        value: count ? String(count) : "—",
        sub: count ? "facilities on network" : "None yet",
        icon: WarehouseIcon,
      },
      {
        label: "Total capacity",
        value: count ? `${formatCompact(totalCapacity)}` : "—",
        sub: count ? "units" : "Add a warehouse",
        icon: Boxes,
      },
      {
        label: "Total used",
        value: count ? `${formatCompact(totalUsed)}` : "—",
        sub: count ? "units occupied" : "No data yet",
        icon: Package,
      },
      {
        label: "Avg utilization",
        value: count ? `${avgUtil}%` : "—",
        sub: count ? "across all sites" : "No data yet",
        icon: Gauge,
      },
    ];
  }, [warehouses]);

  const utilChartData = React.useMemo(
    () =>
      warehouseUtilization(warehouses).map((w) => ({
        label: w.name,
        value: w.pct,
      })),
    [warehouses],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(w: Warehouse) {
    setEditing(w);
    setDialogOpen(true);
  }

  function handleSubmit(values: Omit<Warehouse, "id" | "orgId" | "createdAt">) {
    if (editing) {
      edit(editing.id, values);
      toast.success("Warehouse updated", { description: values.name });
    } else {
      add(values);
      toast.success("Warehouse added", { description: values.name });
    }
    setDialogOpen(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    remove(deleting.id);
    toast.success("Warehouse deleted", { description: deleting.name });
    setDeleting(null);
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Warehouses"
          description="Capacity, coverage and utilization across your fulfilment network."
        >
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add warehouse
          </Button>
        </PageHeader>
      </FadeIn>

      {warehouses.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon={Boxes}
            title="Add your first warehouse"
            description="Register a facility to track its capacity, service coverage and utilization."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add warehouse
              </Button>
            }
          />
        </FadeIn>
      ) : (
        <>
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

          {/* Warehouse cards */}
          <StaggerGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {warehouses.map((w) => {
              const util = utilizationOf(w);
              return (
                <StaggerItem key={w.id}>
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewing(w)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewing(w);
                      }
                    }}
                    className="flex h-full cursor-pointer flex-col p-5 clay-interactive"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-secondary shadow-clay-sm">
                          <WarehouseIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">{w.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {w.code ? <Badge variant="outline">{w.code}</Badge> : null}
                            {w.city || w.country ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[w.city, w.country].filter(Boolean).join(", ")}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${w.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{w.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => openEdit(w)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setDeleting(w)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Utilization */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={cn("font-semibold", utilizationText(util))}>
                          {util}%
                        </span>
                      </div>
                      <Progress value={util} indicatorClassName={utilizationIndicator(util)} />
                      <p className="text-xs text-muted-foreground">
                        {formatCompact(w.usedUnits)} / {formatCompact(w.capacityUnits)} units
                      </p>
                    </div>

                    {w.serviceAreas.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {w.serviceAreas.map((a) => (
                          <Badge key={a} variant="secondary">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {(w.contactName || w.contactPhone) && (
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {w.contactName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {w.contactName}
                          </span>
                        )}
                        {w.contactPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {w.contactPhone}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          {/* Capacity utilization chart */}
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Capacity utilization</CardTitle>
                <CardDescription>
                  Occupancy percentage per facility, from stored capacity and usage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {utilChartData.length === 0 ? (
                  <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground shadow-clay-inset">
                    No data yet — add warehouses to see this chart.
                  </p>
                ) : (
                  <BarStat
                    data={utilChartData}
                    height={320}
                    series={[
                      {
                        key: "value",
                        label: "Utilization %",
                        color: "hsl(var(--primary))",
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}

      {/* Create / edit dialog */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Read detail dialog */}
      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5 text-secondary" />
                  {viewing.name}
                </DialogTitle>
                <DialogDescription>
                  {[viewing.code, viewing.addressLine1, viewing.city, viewing.state, viewing.country]
                    .filter(Boolean)
                    .join(" · ") || "No address on record."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-muted/50 p-3 shadow-clay-inset">
                    <p className="text-lg font-bold">{formatCompact(viewing.capacityUnits)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Capacity
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 shadow-clay-inset">
                    <p className="text-lg font-bold">{formatCompact(viewing.usedUnits)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Used
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 shadow-clay-inset">
                    <p className={cn("text-lg font-bold", utilizationText(utilizationOf(viewing)))}>
                      {utilizationOf(viewing)}%
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Utilization
                    </p>
                  </div>
                </div>

                <Progress
                  value={utilizationOf(viewing)}
                  indicatorClassName={utilizationIndicator(utilizationOf(viewing))}
                />

                {viewing.serviceAreas.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Service areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewing.serviceAreas.map((a) => (
                        <Badge key={a} variant="secondary">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(viewing.contactName || viewing.contactPhone) && (
                  <>
                    <Separator />
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {viewing.contactName && (
                        <p className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          {viewing.contactName}
                        </p>
                      )}
                      {viewing.contactPhone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {viewing.contactPhone}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setViewing(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const w = viewing;
                      setViewing(null);
                      openEdit(w);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete warehouse?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `"${deleting.name}" will be permanently removed. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WarehousesPage() {
  return (
    <React.Suspense fallback={null}>
      <WarehousesInner />
    </React.Suspense>
  );
}

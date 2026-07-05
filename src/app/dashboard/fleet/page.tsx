"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Truck,
  Users,
  Plus,
  Fuel,
  Zap,
  Atom,
  Wind,
  Droplet,
  Wrench,
  Activity,
  Gauge,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { Field, NativeSelect } from "@/components/form/field";
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
import { DonutChart } from "@/components/charts";
import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import { fleetStatusSplit } from "@/lib/analytics/compute";
import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  VEHICLE_STATUSES,
  DRIVER_STATUSES,
} from "@/config/options";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type {
  Vehicle,
  Driver,
  VehicleType,
  FuelType,
  VehicleStatus,
  DriverStatus,
} from "@/lib/db/types";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const VEHICLE_STATUS_VARIANT: Record<VehicleStatus, BadgeVariant> = {
  active: "success",
  idle: "muted",
  maintenance: "warning",
};

const DRIVER_STATUS_VARIANT: Record<DriverStatus, BadgeVariant> = {
  available: "success",
  on_route: "default",
  off_duty: "muted",
};

const FUEL_META: Record<
  FuelType,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  diesel: { icon: Fuel, className: "text-warning" },
  petrol: { icon: Droplet, className: "text-accent" },
  electric: { icon: Zap, className: "text-success" },
  hydrogen: { icon: Atom, className: "text-secondary" },
  cng: { icon: Wind, className: "text-primary" },
};

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// ---------------------------------------------------------------- vehicle form
const vehicleSchema = z.object({
  plate: z.string().trim().min(1, "Plate is required"),
  makeModel: z.string().trim(),
  type: z.enum(["semi", "box_truck", "van", "reefer", "trailer"]),
  fuelType: z.enum(["diesel", "petrol", "electric", "hydrogen", "cng"]),
  capacityKg: z
    .number({ invalid_type_error: "Enter a capacity" })
    .positive("Must be greater than 0"),
  odometerKm: z
    .number({ invalid_type_error: "Enter the odometer" })
    .min(0, "Cannot be negative"),
  status: z.enum(["active", "idle", "maintenance"]),
  purchaseCost: z
    .number({ invalid_type_error: "Enter a cost" })
    .min(0, "Cannot be negative"),
  monthlyMaintenanceCost: z
    .number({ invalid_type_error: "Enter a cost" })
    .min(0, "Cannot be negative"),
  fuelCostPerKm: z
    .number({ invalid_type_error: "Enter a cost" })
    .min(0, "Cannot be negative"),
  driverId: z.string(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Vehicle | null;
  drivers: Driver[];
  onSubmit: (values: {
    data: Omit<Vehicle, "id" | "orgId" | "createdAt">;
    driverId: string | null;
  }) => void;
}

function VehicleDialog({ open, onOpenChange, initial, drivers, onSubmit }: VehicleDialogProps) {
  const emptyDefaults: VehicleFormValues = {
    plate: "",
    makeModel: "",
    type: "semi",
    fuelType: "diesel",
    capacityKg: undefined as unknown as number,
    odometerKm: undefined as unknown as number,
    status: "active",
    purchaseCost: undefined as unknown as number,
    monthlyMaintenanceCost: undefined as unknown as number,
    fuelCostPerKm: undefined as unknown as number,
    driverId: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyDefaults,
  });

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        plate: initial.plate,
        makeModel: initial.makeModel,
        type: initial.type,
        fuelType: initial.fuelType,
        capacityKg: initial.capacityKg,
        odometerKm: initial.odometerKm,
        status: initial.status,
        purchaseCost: initial.purchaseCost,
        monthlyMaintenanceCost: initial.monthlyMaintenanceCost,
        fuelCostPerKm: initial.fuelCostPerKm,
        driverId: initial.driverId ?? "",
      });
    } else {
      reset(emptyDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      data: {
        plate: values.plate,
        makeModel: values.makeModel,
        type: values.type,
        fuelType: values.fuelType,
        capacityKg: values.capacityKg,
        odometerKm: values.odometerKm,
        status: values.status,
        driverId: values.driverId ? values.driverId : null,
        purchaseCost: values.purchaseCost,
        monthlyMaintenanceCost: values.monthlyMaintenanceCost,
        fuelCostPerKm: values.fuelCostPerKm,
      },
      driverId: values.driverId ? values.driverId : null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this vehicle's specification and running costs."
              : "Register a vehicle in your fleet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plate" htmlFor="v-plate" required error={errors.plate?.message}>
              <Input id="v-plate" placeholder="MH-12-AB-1234" {...register("plate")} />
            </Field>
            <Field label="Make & model" htmlFor="v-model" error={errors.makeModel?.message}>
              <Input id="v-model" placeholder="Tata Prima 5530" {...register("makeModel")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Type" htmlFor="v-type" error={errors.type?.message}>
              <NativeSelect id="v-type" {...register("type")}>
                {VEHICLE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Fuel" htmlFor="v-fuel" error={errors.fuelType?.message}>
              <NativeSelect id="v-fuel" {...register("fuelType")}>
                {FUEL_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status" htmlFor="v-status" error={errors.status?.message}>
              <NativeSelect id="v-status" {...register("status")}>
                {VEHICLE_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Capacity (kg)"
              htmlFor="v-capacity"
              required
              error={errors.capacityKg?.message}
            >
              <Input
                id="v-capacity"
                type="number"
                min={1}
                {...register("capacityKg", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Odometer (km)"
              htmlFor="v-odometer"
              required
              error={errors.odometerKm?.message}
            >
              <Input
                id="v-odometer"
                type="number"
                min={0}
                {...register("odometerKm", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Purchase cost"
              htmlFor="v-purchase"
              error={errors.purchaseCost?.message}
            >
              <Input
                id="v-purchase"
                type="number"
                min={0}
                {...register("purchaseCost", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Monthly maintenance"
              htmlFor="v-maint"
              error={errors.monthlyMaintenanceCost?.message}
            >
              <Input
                id="v-maint"
                type="number"
                min={0}
                {...register("monthlyMaintenanceCost", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Fuel cost / km"
              htmlFor="v-fuelcost"
              error={errors.fuelCostPerKm?.message}
            >
              <Input
                id="v-fuelcost"
                type="number"
                min={0}
                step="0.01"
                {...register("fuelCostPerKm", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <Field label="Assigned driver" htmlFor="v-driver" error={errors.driverId?.message}>
            <NativeSelect id="v-driver" {...register("driverId")}>
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initial ? "Save changes" : "Add vehicle"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- driver form
const driverSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email",
    }),
  licenseNo: z.string().trim(),
  status: z.enum(["available", "on_route", "off_duty"]),
  vehicleId: z.string(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Driver | null;
  vehicles: Vehicle[];
  onSubmit: (values: {
    data: Omit<Driver, "id" | "orgId" | "createdAt">;
    vehicleId: string | null;
  }) => void;
}

function DriverDialog({ open, onOpenChange, initial, vehicles, onSubmit }: DriverDialogProps) {
  const emptyDefaults: DriverFormValues = {
    name: "",
    phone: "",
    email: "",
    licenseNo: "",
    status: "available",
    vehicleId: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: emptyDefaults,
  });

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        name: initial.name,
        phone: initial.phone,
        email: initial.email,
        licenseNo: initial.licenseNo,
        status: initial.status,
        vehicleId: initial.vehicleId ?? "",
      });
    } else {
      reset(emptyDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      data: {
        name: values.name,
        phone: values.phone,
        email: values.email,
        licenseNo: values.licenseNo,
        status: values.status,
        vehicleId: values.vehicleId ? values.vehicleId : null,
      },
      vehicleId: values.vehicleId ? values.vehicleId : null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit driver" : "Add driver"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this driver's contact and licence details."
              : "Add a driver to your roster."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="d-name" required error={errors.name?.message}>
            <Input id="d-name" placeholder="Full name" {...register("name")} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="d-phone" error={errors.phone?.message}>
              <Input id="d-phone" {...register("phone")} />
            </Field>
            <Field label="Email" htmlFor="d-email" error={errors.email?.message}>
              <Input id="d-email" type="email" {...register("email")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Licence no." htmlFor="d-license" error={errors.licenseNo?.message}>
              <Input id="d-license" {...register("licenseNo")} />
            </Field>
            <Field label="Status" htmlFor="d-status" error={errors.status?.message}>
              <NativeSelect id="d-status" {...register("status")}>
                {DRIVER_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Assigned vehicle" htmlFor="d-vehicle" error={errors.vehicleId?.message}>
            <NativeSelect id="d-vehicle" {...register("vehicleId")}>
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initial ? "Save changes" : "Add driver"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface KpiChip {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function FleetInner() {
  const vehiclesCol = useCollection("vehicles");
  const driversCol = useCollection("drivers");
  const { items: vehicles } = vehiclesCol;
  const { items: drivers } = driversCol;
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";
  const searchParams = useSearchParams();

  const [vehicleDialogOpen, setVehicleDialogOpen] = React.useState(false);
  const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = React.useState<Vehicle | null>(null);
  const [assigning, setAssigning] = React.useState<Vehicle | null>(null);
  const [assignDriverId, setAssignDriverId] = React.useState("");

  const [driverDialogOpen, setDriverDialogOpen] = React.useState(false);
  const [editingDriver, setEditingDriver] = React.useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = React.useState<Driver | null>(null);

  // ?new=1 → add vehicle · ?new=driver → add driver
  React.useEffect(() => {
    const flag = searchParams.get("new");
    if (flag === "driver") {
      setEditingDriver(null);
      setDriverDialogOpen(true);
    } else if (flag) {
      setEditingVehicle(null);
      setVehicleDialogOpen(true);
    }
  }, [searchParams]);

  const driverName = React.useCallback(
    (id: string | null) => (id ? driversCol.getById(id)?.name ?? "Unassigned" : "Unassigned"),
    [driversCol],
  );
  const vehiclePlate = React.useCallback(
    (id: string | null) => (id ? vehiclesCol.getById(id)?.plate ?? "Unassigned" : "Unassigned"),
    [vehiclesCol],
  );

  // ---- vehicle CRUD ----
  function openCreateVehicle() {
    setEditingVehicle(null);
    setVehicleDialogOpen(true);
  }
  function openEditVehicle(v: Vehicle) {
    setEditingVehicle(v);
    setVehicleDialogOpen(true);
  }
  function submitVehicle({
    data,
  }: {
    data: Omit<Vehicle, "id" | "orgId" | "createdAt">;
    driverId: string | null;
  }) {
    if (editingVehicle) {
      // If the driver changed, keep both sides of the link consistent.
      syncVehicleDriverLink(editingVehicle.id, editingVehicle.driverId, data.driverId);
      vehiclesCol.edit(editingVehicle.id, data);
      toast.success("Vehicle updated", { description: data.plate });
    } else {
      const created = vehiclesCol.add(data);
      if (created && data.driverId) {
        driversCol.edit(data.driverId, { vehicleId: created.id });
      }
      toast.success("Vehicle added", { description: data.plate });
    }
    setVehicleDialogOpen(false);
    setEditingVehicle(null);
  }

  /** Keeps driver.vehicleId in sync when a vehicle's driverId changes. */
  function syncVehicleDriverLink(
    vehicleId: string,
    prevDriverId: string | null,
    nextDriverId: string | null,
  ) {
    if (prevDriverId === nextDriverId) return;
    if (prevDriverId) driversCol.edit(prevDriverId, { vehicleId: null });
    if (nextDriverId) driversCol.edit(nextDriverId, { vehicleId });
  }

  function confirmDeleteVehicle() {
    if (!deletingVehicle) return;
    if (deletingVehicle.driverId) {
      driversCol.edit(deletingVehicle.driverId, { vehicleId: null });
    }
    vehiclesCol.remove(deletingVehicle.id);
    toast.success("Vehicle deleted", { description: deletingVehicle.plate });
    setDeletingVehicle(null);
  }

  function openAssign(v: Vehicle) {
    setAssigning(v);
    setAssignDriverId(v.driverId ?? "");
  }
  function confirmAssign() {
    if (!assigning) return;
    const next = assignDriverId ? assignDriverId : null;
    syncVehicleDriverLink(assigning.id, assigning.driverId, next);
    vehiclesCol.edit(assigning.id, { driverId: next });
    toast.success("Driver assignment updated", {
      description: `${assigning.plate} → ${next ? driverName(next) : "Unassigned"}`,
    });
    setAssigning(null);
  }

  // ---- driver CRUD ----
  function openCreateDriver() {
    setEditingDriver(null);
    setDriverDialogOpen(true);
  }
  function openEditDriver(d: Driver) {
    setEditingDriver(d);
    setDriverDialogOpen(true);
  }
  function submitDriver({
    data,
  }: {
    data: Omit<Driver, "id" | "orgId" | "createdAt">;
    vehicleId: string | null;
  }) {
    if (editingDriver) {
      syncDriverVehicleLink(editingDriver.id, editingDriver.vehicleId, data.vehicleId);
      driversCol.edit(editingDriver.id, data);
      toast.success("Driver updated", { description: data.name });
    } else {
      const created = driversCol.add(data);
      if (created && data.vehicleId) {
        vehiclesCol.edit(data.vehicleId, { driverId: created.id });
      }
      toast.success("Driver added", { description: data.name });
    }
    setDriverDialogOpen(false);
    setEditingDriver(null);
  }

  /** Keeps vehicle.driverId in sync when a driver's vehicleId changes. */
  function syncDriverVehicleLink(
    driverId: string,
    prevVehicleId: string | null,
    nextVehicleId: string | null,
  ) {
    if (prevVehicleId === nextVehicleId) return;
    if (prevVehicleId) vehiclesCol.edit(prevVehicleId, { driverId: null });
    if (nextVehicleId) vehiclesCol.edit(nextVehicleId, { driverId });
  }

  function confirmDeleteDriver() {
    if (!deletingDriver) return;
    if (deletingDriver.vehicleId) {
      vehiclesCol.edit(deletingDriver.vehicleId, { driverId: null });
    }
    driversCol.remove(deletingDriver.id);
    toast.success("Driver deleted", { description: deletingDriver.name });
    setDeletingDriver(null);
  }

  // ---- utilization ----
  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const idleCount = vehicles.filter((v) => v.status === "idle").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance");
  const monthlyRunningCost = vehicles.reduce((a, v) => a + v.monthlyMaintenanceCost, 0);
  const statusData = React.useMemo(() => fleetStatusSplit(vehicles), [vehicles]);

  const utilChips: KpiChip[] = [
    { label: "Active vehicles", value: String(activeCount), icon: Truck },
    { label: "Idle", value: String(idleCount), icon: Gauge },
    { label: "In maintenance", value: String(maintenanceVehicles.length), icon: Wrench },
    { label: "Total drivers", value: String(drivers.length), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Fleet Management"
          description="Vehicles, drivers and utilization across your transport network."
        >
          <Button variant="secondary" onClick={openCreateDriver}>
            <UserPlus className="h-4 w-4" />
            Add driver
          </Button>
          <Button onClick={openCreateVehicle}>
            <Plus className="h-4 w-4" />
            Add vehicle
          </Button>
        </PageHeader>
      </FadeIn>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- Vehicles */}
        <TabsContent value="vehicles">
          {vehicles.length === 0 ? (
            <FadeIn>
              <EmptyState
                icon={Truck}
                title="Register your first vehicle"
                description="Add a vehicle to track its specification, running costs and driver assignment."
                action={
                  <Button onClick={openCreateVehicle}>
                    <Plus className="h-4 w-4" />
                    Add vehicle
                  </Button>
                }
              />
            </FadeIn>
          ) : (
            <FadeIn>
              <Card>
                <CardHeader>
                  <CardTitle>Fleet vehicles</CardTitle>
                  <CardDescription>
                    {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} on record.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[960px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plate</TableHead>
                          <TableHead>Make / model</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Fuel</TableHead>
                          <TableHead className="text-right">Capacity</TableHead>
                          <TableHead className="text-right">Odometer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead className="text-right">Maint./mo</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicles.map((v) => {
                          const Fi = FUEL_META[v.fuelType].icon;
                          return (
                            <TableRow key={v.id}>
                              <TableCell className="font-medium">{v.plate}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {v.makeModel || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {labelOf(VEHICLE_TYPES, v.type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1.5">
                                  <Fi
                                    className={cn("h-4 w-4", FUEL_META[v.fuelType].className)}
                                  />
                                  <span className="text-sm">
                                    {labelOf(FUEL_TYPES, v.fuelType)}
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatNumber(v.capacityKg)} kg
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {formatNumber(v.odometerKm)} km
                              </TableCell>
                              <TableCell>
                                <Badge variant={VEHICLE_STATUS_VARIANT[v.status]}>
                                  {labelOf(VEHICLE_STATUSES, v.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {driverName(v.driverId)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCurrency(v.monthlyMaintenanceCost, currency)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Actions for ${v.plate}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{v.plate}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => openEditVehicle(v)}>
                                      <Pencil className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openAssign(v)}>
                                      <UserPlus className="h-4 w-4" />
                                      Assign driver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={() => setDeletingVehicle(v)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
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
          )}
        </TabsContent>

        {/* ---------------------------------------------------- Drivers */}
        <TabsContent value="drivers">
          {drivers.length === 0 ? (
            <FadeIn>
              <EmptyState
                icon={Users}
                title="Add your first driver"
                description="Build your roster to assign drivers to vehicles and shipments."
                action={
                  <Button onClick={openCreateDriver}>
                    <UserPlus className="h-4 w-4" />
                    Add driver
                  </Button>
                }
              />
            </FadeIn>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {drivers.map((d) => (
                <StaggerItem key={d.id}>
                  <Card className="flex h-full flex-col p-5 clay-interactive">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-tight">{d.name}</p>
                        {d.licenseNo && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BadgeCheck className="h-3 w-3" />
                            {d.licenseNo}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge variant={DRIVER_STATUS_VARIANT[d.status]}>
                          {labelOf(DRIVER_STATUSES, d.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${d.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{d.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => openEditDriver(d)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setDeletingDriver(d)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      {d.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {d.phone}
                        </p>
                      )}
                      {d.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{d.email}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-sm shadow-clay-inset">
                      <Truck className="h-4 w-4 text-secondary" />
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="ml-auto font-medium">
                        {vehiclePlate(d.vehicleId)}
                      </span>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </TabsContent>

        {/* ---------------------------------------------------- Utilization */}
        <TabsContent value="utilization">
          <div className="space-y-6">
            <StaggerGroup className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {utilChips.map((c) => {
                const Icon = c.icon;
                return (
                  <StaggerItem key={c.label}>
                    <Card className="p-5 clay-interactive">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{c.label}</p>
                          <p className="text-2xl font-bold tracking-tight">{c.value}</p>
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FadeIn>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Fleet status split
                    </CardTitle>
                    <CardDescription>Vehicles by operating status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statusData.length === 0 ? (
                      <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground shadow-clay-inset">
                        No data yet — add vehicles to see this chart.
                      </p>
                    ) : (
                      <DonutChart data={statusData} height={260} />
                    )}
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.05}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-warning" />
                      Running costs & maintenance
                    </CardTitle>
                    <CardDescription>
                      Monthly maintenance spend and vehicles currently in service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                      <p className="text-sm text-muted-foreground">Total monthly maintenance</p>
                      <p className="mt-1 text-2xl font-bold">
                        {formatCurrency(monthlyRunningCost, currency)}
                      </p>
                    </div>

                    {maintenanceVehicles.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-sm text-success shadow-clay-inset">
                        <CheckCircle2 className="h-4 w-4" />
                        No vehicles in maintenance.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {maintenanceVehicles.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 shadow-clay-inset"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{v.plate}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {[v.makeModel, labelOf(VEHICLE_TYPES, v.type)]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <Badge variant="warning">Maintenance</Badge>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {driverName(v.driverId)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Vehicle create / edit */}
      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={(o) => {
          setVehicleDialogOpen(o);
          if (!o) setEditingVehicle(null);
        }}
        initial={editingVehicle}
        drivers={drivers}
        onSubmit={submitVehicle}
      />

      {/* Driver create / edit */}
      <DriverDialog
        open={driverDialogOpen}
        onOpenChange={(o) => {
          setDriverDialogOpen(o);
          if (!o) setEditingDriver(null);
        }}
        initial={editingDriver}
        vehicles={vehicles}
        onSubmit={submitDriver}
      />

      {/* Assign driver */}
      <Dialog open={assigning !== null} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign driver</DialogTitle>
            <DialogDescription>
              {assigning ? `Choose a driver for ${assigning.plate}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <Field label="Driver" htmlFor="assign-driver">
            <NativeSelect
              id="assign-driver"
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssigning(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAssign}>Save assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete vehicle */}
      <Dialog open={deletingVehicle !== null} onOpenChange={(o) => !o && setDeletingVehicle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete vehicle?</DialogTitle>
            <DialogDescription>
              {deletingVehicle
                ? `"${deletingVehicle.plate}" will be permanently removed. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingVehicle(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteVehicle}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete driver */}
      <Dialog open={deletingDriver !== null} onOpenChange={(o) => !o && setDeletingDriver(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete driver?</DialogTitle>
            <DialogDescription>
              {deletingDriver
                ? `"${deletingDriver.name}" will be permanently removed. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingDriver(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDriver}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FleetPage() {
  return (
    <React.Suspense fallback={null}>
      <FleetInner />
    </React.Suspense>
  );
}

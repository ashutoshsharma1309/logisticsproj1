"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  ArrowRightCircle,
  Trash2,
  Package,
  Truck,
  CheckCircle2,
  Wallet,
  Leaf,
  MapPin,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { FadeIn } from "@/components/shared/motion";
import { Field, NativeSelect } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useCollection } from "@/hooks/use-collection";
import { useAuth } from "@/components/providers/auth-provider";
import {
  shipmentCost,
  shipmentEmissions,
  nextReference,
} from "@/lib/domain/calc";
import { mintLedgerBlock } from "@/lib/ledger/mint";
import { pushNotification } from "@/lib/db/audit";
import {
  TRANSPORT_MODES,
  SHIPMENT_STATUSES,
  PRIORITIES,
} from "@/config/options";
import { MODE_META, integrityVariant } from "@/config/status";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type {
  Shipment,
  Customer,
  Warehouse,
  Driver,
  Vehicle,
  ShipmentStatus,
  TransportMode,
} from "@/lib/db/types";

const PAGE_SIZE = 10;

/** Linear happy-path flow used by "Advance status". */
const STATUS_FLOW: ShipmentStatus[] = [
  "pending",
  "in_transit",
  "at_warehouse",
  "out_for_delivery",
  "delivered",
];

function nextStatus(current: ShipmentStatus): ShipmentStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1) return "in_transit"; // customs / delayed / exception → resume transit
  if (idx >= STATUS_FLOW.length - 1) return null; // already delivered
  return STATUS_FLOW[idx + 1] ?? null;
}

function ModeIcon({ mode, className }: { mode: TransportMode; className?: string }) {
  const Icon = (Icons[MODE_META[mode].icon as keyof typeof Icons] ??
    Icons.Truck) as Icons.LucideIcon;
  return <Icon className={className} />;
}

// ── Validation ──────────────────────────────────────────────────────────────
const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  originWarehouseId: z.string().min(1, "Select an origin warehouse"),
  destinationCity: z.string().trim().min(1, "Destination city is required"),
  destinationState: z.string().trim().default(""),
  destinationCountry: z.string().trim().default(""),
  mode: z.enum(["truck", "ship", "plane", "rail"]),
  priority: z.enum(["standard", "express", "critical"]),
  status: z.enum([
    "pending",
    "in_transit",
    "at_warehouse",
    "customs",
    "out_for_delivery",
    "delivered",
    "delayed",
    "exception",
  ]),
  weightKg: z.coerce.number().positive("Weight must be greater than 0"),
  distanceKm: z.coerce.number().min(0, "Cannot be negative"),
  packages: z.coerce
    .number()
    .int("Whole number only")
    .min(1, "At least 1 package"),
  freightCharge: z.coerce.number().min(0, "Cannot be negative").default(0),
  fuelCost: z.coerce.number().min(0, "Cannot be negative").default(0),
  packagingCost: z.coerce.number().min(0, "Cannot be negative").default(0),
  insuranceCost: z.coerce.number().min(0, "Cannot be negative").default(0),
  otherCost: z.coerce.number().min(0, "Cannot be negative").default(0),
  taxRatePct: z.coerce.number().min(0, "Cannot be negative").default(0),
  driverId: z.string().default(""),
  vehicleId: z.string().default(""),
  eta: z.string().default(""),
  notes: z.string().default(""),
});

type FormValues = z.infer<typeof schema>;

function toDateInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function defaultValues(editing: Shipment | null): FormValues {
  if (editing) {
    return {
      customerId: editing.customerId,
      originWarehouseId: editing.originWarehouseId,
      destinationCity: editing.destinationCity,
      destinationState: editing.destinationState,
      destinationCountry: editing.destinationCountry,
      mode: editing.mode,
      priority: editing.priority,
      status: editing.status,
      weightKg: editing.weightKg,
      distanceKm: editing.distanceKm,
      packages: editing.packages,
      freightCharge: editing.freightCharge,
      fuelCost: editing.fuelCost,
      packagingCost: editing.packagingCost,
      insuranceCost: editing.insuranceCost,
      otherCost: editing.otherCost,
      taxRatePct: editing.taxRatePct,
      driverId: editing.driverId ?? "",
      vehicleId: editing.vehicleId ?? "",
      eta: toDateInput(editing.eta),
      notes: editing.notes,
    };
  }
  return {
    customerId: "",
    originWarehouseId: "",
    destinationCity: "",
    destinationState: "",
    destinationCountry: "",
    mode: "truck",
    priority: "standard",
    status: "pending",
    weightKg: 0,
    distanceKm: 0,
    packages: 1,
    freightCharge: 0,
    fuelCost: 0,
    packagingCost: 0,
    insuranceCost: 0,
    otherCost: 0,
    taxRatePct: 0,
    driverId: "",
    vehicleId: "",
    eta: "",
    notes: "",
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  return (
    <React.Suspense fallback={<div className="h-40" aria-hidden />}>
      <ShipmentsView />
    </React.Suspense>
  );
}

function ShipmentsView() {
  const searchParams = useSearchParams();
  const { orgId, org } = useAuth();
  const currency = org?.currency ?? "USD";

  const shipmentsCol = useCollection("shipments");
  const customersCol = useCollection("customers");
  const warehousesCol = useCollection("warehouses");
  const vehiclesCol = useCollection("vehicles");
  const driversCol = useCollection("drivers");

  const shipments = shipmentsCol.items;
  const customers = customersCol.items;
  const warehouses = warehousesCol.items;

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [modeFilter, setModeFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Shipment | null>(null);
  const [detail, setDetail] = React.useState<Shipment | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Shipment | null>(null);

  // ?new=1 deep-link → open create dialog on mount.
  const openedFromLink = React.useRef(false);
  React.useEffect(() => {
    if (openedFromLink.current) return;
    if (searchParams.get("new") === "1") {
      openedFromLink.current = true;
      setEditing(null);
      setFormOpen(true);
    }
  }, [searchParams]);

  const customerName = React.useCallback(
    (id: string) => customersCol.getById(id)?.name ?? "—",
    [customersCol],
  );
  const warehouseName = React.useCallback(
    (id: string) => warehousesCol.getById(id)?.name ?? "—",
    [warehousesCol],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      const cName = customerName(s.customerId).toLowerCase();
      const matchesQuery =
        q === "" ||
        s.reference.toLowerCase().includes(q) ||
        s.destinationCity.toLowerCase().includes(q) ||
        cName.includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesMode = modeFilter === "all" || s.mode === modeFilter;
      return matchesQuery && matchesStatus && matchesMode;
    });
  }, [shipments, search, statusFilter, modeFilter, customerName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const summary = React.useMemo(() => {
    let value = 0;
    let active = 0;
    let delivered = 0;
    for (const s of filtered) {
      value += shipmentCost(s).total;
      if (s.status === "delivered") delivered += 1;
      else if (s.status !== "exception") active += 1;
    }
    return { total: filtered.length, active, delivered, value };
  }, [filtered]);

  function resetPage() {
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(s: Shipment) {
    setEditing(s);
    setFormOpen(true);
  }

  function handleSubmit(values: FormValues) {
    if (!orgId) return;
    const updatedAt = new Date().toISOString();
    const normalized = {
      ...values,
      driverId: values.driverId || null,
      vehicleId: values.vehicleId || null,
      eta: values.eta ? new Date(values.eta).toISOString() : "",
    };

    if (editing) {
      const statusChanged = editing.status !== values.status;
      const updated = shipmentsCol.edit(editing.id, { ...normalized, updatedAt });
      if (updated && statusChanged) {
        mintLedgerBlock(orgId, updated, values.status, values.destinationCity);
      }
      toast.success(`Shipment ${editing.reference} updated`);
    } else {
      const reference = nextReference(shipments.length);
      const created = shipmentsCol.add({ ...normalized, reference, updatedAt });
      if (created) {
        const originWarehouse = warehousesCol.getById(created.originWarehouseId);
        mintLedgerBlock(
          orgId,
          created,
          created.status,
          originWarehouse?.city || created.destinationCity,
        );
        pushNotification({
          orgId,
          title: "Shipment created",
          body: reference,
          kind: "success",
          href: "/dashboard/shipments",
        });
        toast.success(`Shipment ${reference} created`);
      }
    }
    setFormOpen(false);
    setEditing(null);
    resetPage();
  }

  function handleAdvance(s: Shipment) {
    if (!orgId) return;
    const next = nextStatus(s.status);
    if (!next) {
      toast.info(`${s.reference} is already delivered`);
      return;
    }
    const updatedAt = new Date().toISOString();
    const updated = shipmentsCol.edit(s.id, { status: next, updatedAt });
    if (updated) {
      mintLedgerBlock(orgId, updated, next, updated.destinationCity);
      pushNotification({
        orgId,
        title: "Shipment status advanced",
        body: `${s.reference} → ${statusLabel(next)}`,
        kind: "info",
        href: "/dashboard/shipments",
      });
      toast.success(`${s.reference} advanced to ${statusLabel(next)}`);
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    shipmentsCol.remove(deleteTarget.id);
    toast.success(`Shipment ${deleteTarget.reference} deleted`);
    setDeleteTarget(null);
  }

  const summaryChips = [
    { label: "Total", value: formatNumber(summary.total), icon: Package, tint: "text-primary bg-primary/12" },
    { label: "Active", value: formatNumber(summary.active), icon: Truck, tint: "text-accent bg-accent/12" },
    { label: "Delivered", value: formatNumber(summary.delivered), icon: CheckCircle2, tint: "text-success bg-success/12" },
    { label: "Total value", value: formatCurrency(summary.value, currency), icon: Wallet, tint: "text-warning bg-warning/12" },
  ];

  const isEmpty = shipments.length === 0;

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Shipments"
          description="Create, track and verify every consignment — each status change is anchored to your immutable ledger."
        >
          <Button variant="gradient" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New shipment
          </Button>
        </PageHeader>
      </FadeIn>

      {isEmpty ? (
        <FadeIn delay={0.05}>
          <Card className="p-6">
            <EmptyState
              icon={Package}
              title="Create your first shipment"
              description="You have no shipments yet. Register a consignment to start tracking routes, costs and ledger-verified status changes."
              action={
                <Button variant="gradient" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New shipment
                </Button>
              }
            />
          </Card>
        </FadeIn>
      ) : (
        <>
          {/* Summary strip */}
          <FadeIn delay={0.05} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {summaryChips.map((chip) => (
              <Card key={chip.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-clay-inset",
                      chip.tint,
                    )}
                  >
                    <chip.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold tracking-tight">
                      {chip.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{chip.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </FadeIn>

          {/* Toolbar */}
          <FadeIn delay={0.1}>
            <Card className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      resetPage();
                    }}
                    placeholder="Search by reference, destination or customer…"
                    className="pl-10"
                    aria-label="Search shipments"
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger className="w-[160px]" aria-label="Filter by status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {SHIPMENT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={modeFilter}
                    onValueChange={(v) => {
                      setModeFilter(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger className="w-[150px]" aria-label="Filter by mode">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All modes</SelectItem>
                      {TRANSPORT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Table */}
          <FadeIn delay={0.15}>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={9}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          No shipments match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((s) => (
                        <TableRow
                          key={s.id}
                          onClick={() => setDetail(s)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-mono text-sm font-semibold">
                            {s.reference}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate">
                            {customerName(s.customerId)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {warehouseName(s.originWarehouseId)}
                            </span>
                            {" → "}
                            <span className="font-medium text-foreground">
                              {s.destinationCity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} />
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <ModeIcon
                                mode={s.mode}
                                className="h-4 w-4 text-muted-foreground"
                              />
                              {MODE_META[s.mode].label}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatNumber(s.weightKg)} kg
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {formatCurrency(shipmentCost(s).total, currency)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {s.eta ? formatDate(s.eta) : "—"}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${s.reference}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{s.reference}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDetail(s)}>
                                  <Eye className="h-4 w-4" />
                                  View detail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(s)}>
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAdvance(s)}
                                  disabled={s.status === "delivered"}
                                >
                                  <ArrowRightCircle className="h-4 w-4" />
                                  Advance status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10"
                                  onClick={() => setDeleteTarget(s)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                  </span>
                  –
                  <span className="font-semibold text-foreground">
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  shipments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        </>
      )}

      {/* Create / Edit dialog */}
      <ShipmentFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        customers={customers}
        warehouses={warehouses}
        drivers={driversCol.items}
        vehicles={vehiclesCol.items}
        currency={currency}
        onSubmit={handleSubmit}
      />

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {detail && (
            <ShipmentDetail
              shipment={detail}
              currency={currency}
              customer={customersCol.getById(detail.customerId) ?? null}
              warehouse={warehousesCol.getById(detail.originWarehouseId) ?? null}
              driver={detail.driverId ? driversCol.getById(detail.driverId) ?? null : null}
              vehicle={detail.vehicleId ? vehiclesCol.getById(detail.vehicleId) ?? null : null}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete shipment?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Shipment ${deleteTarget.reference} will be permanently removed. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// ── Create / Edit dialog ─────────────────────────────────────────────────────
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Shipment | null;
  customers: Customer[];
  warehouses: Warehouse[];
  drivers: Driver[];
  vehicles: Vehicle[];
  currency: string;
  onSubmit: (values: FormValues) => void;
}

function ShipmentFormDialog({
  open,
  onOpenChange,
  editing,
  customers,
  warehouses,
  drivers,
  vehicles,
  currency,
  onSubmit,
}: FormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(editing),
  });

  React.useEffect(() => {
    if (open) reset(defaultValues(editing));
  }, [open, editing, reset]);

  const noCustomers = customers.length === 0;
  const noWarehouses = warehouses.length === 0;
  const blocked = noCustomers || noWarehouses;

  const cost = watch([
    "freightCharge",
    "fuelCost",
    "packagingCost",
    "insuranceCost",
    "otherCost",
    "taxRatePct",
  ]);
  const liveTotal = shipmentCost({
    freightCharge: toNum(cost[0]),
    fuelCost: toNum(cost[1]),
    packagingCost: toNum(cost[2]),
    insuranceCost: toNum(cost[3]),
    otherCost: toNum(cost[4]),
    taxRatePct: toNum(cost[5]),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit shipment" : "New shipment"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update consignment details. Status changes mint a new ledger block."
              : "Register a new consignment. It is anchored to the ledger on creation."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Customer + origin */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Customer"
              htmlFor="customerId"
              required
              error={errors.customerId?.message}
              hint={noCustomers ? undefined : "Consignee"}
            >
              <NativeSelect
                id="customerId"
                disabled={noCustomers}
                {...register("customerId")}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </NativeSelect>
              {noCustomers && (
                <p className="text-xs text-muted-foreground">
                  <Link
                    href="/dashboard/customers?new=1"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Add a customer first
                  </Link>{" "}
                  to create a shipment.
                </p>
              )}
            </Field>

            <Field
              label="Origin warehouse"
              htmlFor="originWarehouseId"
              required
              error={errors.originWarehouseId?.message}
              hint={noWarehouses ? undefined : "Dispatch hub"}
            >
              <NativeSelect
                id="originWarehouseId"
                disabled={noWarehouses}
                {...register("originWarehouseId")}
              >
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {w.city ? ` — ${w.city}` : ""}
                  </option>
                ))}
              </NativeSelect>
              {noWarehouses && (
                <p className="text-xs text-muted-foreground">
                  <Link
                    href="/dashboard/warehouses?new=1"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Add a warehouse first
                  </Link>{" "}
                  to set an origin.
                </p>
              )}
            </Field>
          </div>

          {/* Destination */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Destination city"
              htmlFor="destinationCity"
              required
              error={errors.destinationCity?.message}
            >
              <Input id="destinationCity" {...register("destinationCity")} placeholder="e.g. Mumbai" />
            </Field>
            <Field label="Destination state" htmlFor="destinationState">
              <Input id="destinationState" {...register("destinationState")} placeholder="e.g. Maharashtra" />
            </Field>
            <Field label="Destination country" htmlFor="destinationCountry">
              <Input id="destinationCountry" {...register("destinationCountry")} placeholder="e.g. India" />
            </Field>
          </div>

          {/* Mode / priority / status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Mode" htmlFor="mode">
              <NativeSelect id="mode" {...register("mode")}>
                {TRANSPORT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priority" htmlFor="priority">
              <NativeSelect id="priority" {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status" htmlFor="status">
              <NativeSelect id="status" {...register("status")}>
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Weight (kg)"
              htmlFor="weightKg"
              required
              error={errors.weightKg?.message}
            >
              <Input
                id="weightKg"
                type="number"
                min={0}
                step="any"
                {...register("weightKg")}
              />
            </Field>
            <Field
              label="Distance (km)"
              htmlFor="distanceKm"
              error={errors.distanceKm?.message}
            >
              <Input
                id="distanceKm"
                type="number"
                min={0}
                step="any"
                {...register("distanceKm")}
              />
            </Field>
            <Field
              label="Packages"
              htmlFor="packages"
              required
              error={errors.packages?.message}
            >
              <Input
                id="packages"
                type="number"
                min={1}
                step={1}
                {...register("packages")}
              />
            </Field>
          </div>

          <Separator />

          {/* Cost breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Cost breakdown</p>
              <span className="text-xs text-muted-foreground">
                Amounts in {currency}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Freight charge" htmlFor="freightCharge" error={errors.freightCharge?.message}>
                <Input id="freightCharge" type="number" min={0} step="any" {...register("freightCharge")} />
              </Field>
              <Field label="Fuel cost" htmlFor="fuelCost" error={errors.fuelCost?.message}>
                <Input id="fuelCost" type="number" min={0} step="any" {...register("fuelCost")} />
              </Field>
              <Field label="Packaging" htmlFor="packagingCost" error={errors.packagingCost?.message}>
                <Input id="packagingCost" type="number" min={0} step="any" {...register("packagingCost")} />
              </Field>
              <Field label="Insurance" htmlFor="insuranceCost" error={errors.insuranceCost?.message}>
                <Input id="insuranceCost" type="number" min={0} step="any" {...register("insuranceCost")} />
              </Field>
              <Field label="Other" htmlFor="otherCost" error={errors.otherCost?.message}>
                <Input id="otherCost" type="number" min={0} step="any" {...register("otherCost")} />
              </Field>
              <Field label="Tax rate (%)" htmlFor="taxRatePct" error={errors.taxRatePct?.message}>
                <Input id="taxRatePct" type="number" min={0} step="any" {...register("taxRatePct")} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3 shadow-clay-inset">
              <div className="text-xs text-muted-foreground">
                Subtotal {formatCurrency(liveTotal.subtotal, currency)} · Tax{" "}
                {formatCurrency(liveTotal.tax, currency)}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {formatCurrency(liveTotal.total, currency)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignments + meta */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Driver" htmlFor="driverId" hint="Optional">
              <NativeSelect id="driverId" {...register("driverId")}>
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Vehicle" htmlFor="vehicleId" hint="Optional">
              <NativeSelect id="vehicleId" {...register("vehicleId")}>
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.makeModel}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ETA" htmlFor="eta" hint="Estimated arrival">
              <Input id="eta" type="date" {...register("eta")} />
            </Field>
            <Field label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                rows={2}
                {...register("notes")}
                placeholder="Handling instructions, references…"
              />
            </Field>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={blocked}>
              {editing ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Save changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create shipment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── Detail dialog ────────────────────────────────────────────────────────────
interface DetailProps {
  shipment: Shipment;
  currency: string;
  customer: Customer | null;
  warehouse: Warehouse | null;
  driver: Driver | null;
  vehicle: Vehicle | null;
}

function ShipmentDetail({
  shipment,
  currency,
  customer,
  warehouse,
  driver,
  vehicle,
}: DetailProps) {
  const ledgerCol = useCollection("ledger");
  const blocks = React.useMemo(
    () =>
      ledgerCol.items
        .filter((b) => b.shipmentId === shipment.id)
        .sort((a, b) => a.blockIndex - b.blockIndex),
    [ledgerCol.items, shipment.id],
  );

  const cost = shipmentCost(shipment);
  const emissions = shipmentEmissions(shipment);

  const costLines: { label: string; value: number }[] = [
    { label: "Freight charge", value: cost.freight },
    { label: "Fuel cost", value: cost.fuel },
    { label: "Packaging", value: cost.packaging },
    { label: "Insurance", value: cost.insurance },
    { label: "Other", value: cost.other },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-mono">
          {shipment.reference}
          <StatusBadge status={shipment.status} />
        </DialogTitle>
        <DialogDescription>
          {warehouse?.name ?? "—"} → {shipment.destinationCity} ·{" "}
          {MODE_META[shipment.mode].label} · {formatNumber(shipment.weightKg)} kg ·{" "}
          {formatNumber(shipment.packages)} pkg
        </DialogDescription>
      </DialogHeader>

      {/* Parties + route */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <UserRound className="h-3 w-3" /> Customer
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {customer?.name ?? "—"}
          </p>
          {customer?.company && (
            <p className="truncate text-xs text-muted-foreground">
              {customer.company}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3 w-3" /> Route
          </p>
          <p className="mt-1 text-sm font-semibold">
            {warehouse?.name ?? "—"} → {shipment.destinationCity}
          </p>
          <p className="text-xs text-muted-foreground">
            {[shipment.destinationState, shipment.destinationCountry]
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Truck className="h-3 w-3" /> Assignment
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {driver?.name ?? "Unassigned"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {vehicle ? `${vehicle.plate} · ${vehicle.makeModel}` : "No vehicle"}
          </p>
        </div>
      </div>

      {/* Cost + emissions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cost breakdown
          </p>
          <dl className="space-y-1.5 text-sm">
            {costLines.map((line) => (
              <div key={line.label} className="flex justify-between">
                <dt className="text-muted-foreground">{line.label}</dt>
                <dd className="tabular-nums">
                  {formatCurrency(line.value, currency)}
                </dd>
              </div>
            ))}
            <Separator className="my-1.5" />
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(cost.subtotal, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Tax ({formatNumber(shipment.taxRatePct)}%)
              </dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(cost.tax, currency)}
              </dd>
            </div>
            <Separator className="my-1.5" />
            <div className="flex justify-between text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold tabular-nums text-primary">
                {formatCurrency(cost.total, currency)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col justify-center rounded-2xl bg-success/10 p-4 shadow-clay-inset">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Leaf className="h-3 w-3 text-success" /> Est. CO₂
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-success">
            {formatNumber(emissions, 1)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              kg
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNumber(shipment.distanceKm)} km · {MODE_META[shipment.mode].label}
          </p>
        </div>
      </div>

      {shipment.notes && (
        <div className="rounded-2xl bg-muted/40 p-3 text-sm shadow-clay-inset">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="mt-1 whitespace-pre-wrap">{shipment.notes}</p>
        </div>
      )}

      <Separator />

      {/* Ledger timeline */}
      <div>
        <p className="mb-2 text-sm font-semibold">
          Ledger timeline
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
          </span>
        </p>
        {blocks.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 py-6 text-center text-sm text-muted-foreground shadow-clay-inset">
            No ledger blocks recorded yet for this shipment.
          </p>
        ) : (
          <ScrollArea className="max-h-[340px] pr-3">
            <ol className="relative space-y-4 pl-5">
              <span
                aria-hidden
                className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-border"
              />
              {blocks.map((b) => (
                <li key={b.id} className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <div className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{b.blockIndex}
                        </span>
                        {b.action}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        <Badge variant={integrityVariant(b.integrityScore)}>
                          {b.integrityScore}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <HashBadge value={b.hash} label="hash" />
                      <HashBadge value={b.previousHash} label="prev" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {b.location} · verified by{" "}
                      <span className="font-medium text-foreground">
                        {b.verifier}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

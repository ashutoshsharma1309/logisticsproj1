"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  ShieldCheck,
  Trash2,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { getStore } from "@/services/store";
import {
  STATUS_META,
  MODE_META,
  integrityVariant,
  healthColor,
} from "@/config/status";
import { HUB_LIST } from "@/lib/geo";
import { simHash } from "@/lib/hash";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type {
  Shipment,
  ShipmentStatus,
  TransportMode,
  GeoPoint,
} from "@/types";

const PAGE_SIZE = 10;
const STATUS_KEYS = Object.keys(STATUS_META) as ShipmentStatus[];
const MODE_KEYS = Object.keys(MODE_META) as TransportMode[];
const DAY = 86_400_000;

function cityOf(label: string): string {
  return label.split(",")[0]?.trim() ?? label;
}

function ModeIcon({ mode, className }: { mode: TransportMode; className?: string }) {
  const Icon = (Icons[MODE_META[mode].icon as keyof typeof Icons] ??
    Icons.Truck) as Icons.LucideIcon;
  return <Icon className={className} />;
}

interface CreateForm {
  customer: string;
  origin: string;
  destination: string;
  mode: TransportMode;
  weightKg: string;
  priority: Shipment["priority"];
}

const EMPTY_FORM: CreateForm = {
  customer: "",
  origin: HUB_LIST[0].label,
  destination: HUB_LIST[1].label,
  mode: "truck",
  weightKg: "",
  priority: "standard",
};

export default function ShipmentsPage() {
  const store = getStore();
  const [shipments, setShipments] = React.useState<Shipment[]>(store.shipments);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [modeFilter, setModeFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<CreateForm>(EMPTY_FORM);

  const [detail, setDetail] = React.useState<Shipment | null>(null);
  const newCount = React.useRef(0);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesQuery =
        q === "" ||
        s.reference.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesMode = modeFilter === "all" || s.mode === modeFilter;
      return matchesQuery && matchesStatus && matchesMode;
    });
  }, [shipments, search, statusFilter, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const stats = React.useMemo(
    () => ({
      total: shipments.length,
      inTransit: shipments.filter((s) => s.status === "in_transit").length,
      delivered: shipments.filter((s) => s.status === "delivered").length,
      delayed: shipments.filter(
        (s) => s.status === "delayed" || s.status === "exception",
      ).length,
    }),
    [shipments],
  );

  function resetPage() {
    setPage(1);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const origin = HUB_LIST.find((h) => h.label === form.origin) as GeoPoint;
    const destination = HUB_LIST.find(
      (h) => h.label === form.destination,
    ) as GeoPoint;
    if (!form.customer.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (origin.label === destination.label) {
      toast.error("Origin and destination must differ");
      return;
    }
    const weight = Math.max(1, Number(form.weightKg) || 500);
    newCount.current += 1;
    const reference = `CR-N${String(90000 + newCount.current)}`;
    const created: Shipment = {
      id: `ship-new-${newCount.current}`,
      reference,
      origin,
      destination,
      status: "pending",
      mode: form.mode,
      customer: form.customer.trim(),
      carrier: "Meridian Freight",
      driverId: null,
      vehicleId: null,
      weightKg: weight,
      volumeM3: Math.round(weight / 180),
      valueUsd: Math.round(weight * 120),
      progress: 0,
      createdAt: new Date().toISOString(),
      eta: new Date(Date.now() + 6 * DAY).toISOString(),
      healthScore: 100,
      integrityScore: 100,
      riskLevel: "low",
      delayProbability: 0.05,
      co2Kg: Math.round(weight * 0.02),
      priority: form.priority,
      contents: "General cargo",
      ledgerHead: simHash(reference),
    };
    setShipments((prev) => [created, ...prev]);
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    resetPage();
    toast.success(`Shipment ${reference} created`, {
      description: `${cityOf(origin.label)} → ${cityOf(destination.label)}`,
    });
  }

  function handleDelete(s: Shipment) {
    setShipments((prev) => prev.filter((x) => x.id !== s.id));
    toast.success(`Shipment ${s.reference} deleted`);
  }

  function handleVerify(s: Shipment) {
    toast.success(`${s.reference} verified on ledger`, {
      description: `Integrity ${s.integrityScore}% · head ${s.ledgerHead.slice(0, 10)}…`,
    });
  }

  const summaryChips = [
    { label: "Total", value: stats.total, icon: Package, tint: "text-primary bg-primary/12" },
    { label: "In Transit", value: stats.inTransit, icon: Truck, tint: "text-accent bg-accent/12" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, tint: "text-success bg-success/12" },
    { label: "Delayed", value: stats.delayed, icon: AlertTriangle, tint: "text-warning bg-warning/12" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Shipments"
          description="Track, verify and manage every consignment across the ChainRoute network — each state change anchored to the immutable ledger."
        >
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create shipment
          </Button>
        </PageHeader>
      </FadeIn>

      {/* Summary chips */}
      <FadeIn
        delay={0.05}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {summaryChips.map((chip) => (
          <Card key={chip.label} className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl shadow-clay-inset",
                  chip.tint,
                )}
              >
                <chip.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{chip.value}</p>
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
                placeholder="Search by reference or customer…"
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
                <SelectTrigger className="w-[150px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_KEYS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
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
                <SelectTrigger className="w-[140px]" aria-label="Filter by mode">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  {MODE_KEYS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_META[m].label}
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Integrity</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={10}
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
                      {s.customer}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {cityOf(s.origin.label)}
                      </span>
                      {" → "}
                      <span className="font-medium text-foreground">
                        {cityOf(s.destination.label)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <ModeIcon mode={s.mode} className="h-4 w-4 text-muted-foreground" />
                        {MODE_META[s.mode].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          healthColor(s.healthScore),
                        )}
                      >
                        {s.healthScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={integrityVariant(s.integrityScore)}>
                        {s.integrityScore}%
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.eta)}
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={s.riskLevel} />
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
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(`Editing ${s.reference}`, {
                                description: "Opening editor…",
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(s)}>
                            <ShieldCheck className="h-4 w-4" />
                            Verify on ledger
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(s)}
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create shipment</DialogTitle>
            <DialogDescription>
              Register a new consignment. It will be anchored to the ledger on
              dispatch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer</Label>
              <Input
                id="customer"
                value={form.customer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer: e.target.value }))
                }
                placeholder="e.g. Northwind Traders"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Origin</Label>
                <Select
                  value={form.origin}
                  onValueChange={(v) => setForm((f) => ({ ...f, origin: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_LIST.map((h) => (
                      <SelectItem key={h.label} value={h.label}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Select
                  value={form.destination}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, destination: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_LIST.map((h) => (
                      <SelectItem key={h.label} value={h.label}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, mode: v as TransportMode }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_KEYS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODE_META[m].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  value={form.weightKg}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weightKg: e.target.value }))
                  }
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      priority: v as Shipment["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="gradient">
                <Plus className="h-4 w-4" />
                Create shipment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && <ShipmentDetail shipment={detail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShipmentDetail({ shipment }: { shipment: Shipment }) {
  const { ledger } = getStore();
  const events = React.useMemo(
    () =>
      ledger
        .filter((e) => e.shipmentId === shipment.id)
        .sort((a, b) => a.blockIndex - b.blockIndex),
    [ledger, shipment.id],
  );

  const summary = [
    {
      label: "Health",
      node: (
        <span className={cn("font-bold", healthColor(shipment.healthScore))}>
          {shipment.healthScore}
        </span>
      ),
    },
    {
      label: "Integrity",
      node: (
        <Badge variant={integrityVariant(shipment.integrityScore)}>
          {shipment.integrityScore}%
        </Badge>
      ),
    },
    { label: "Risk", node: <RiskBadge level={shipment.riskLevel} /> },
    {
      label: "Value",
      node: (
        <span className="font-semibold">
          {formatCurrency(shipment.valueUsd)}
        </span>
      ),
    },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-mono">
          {shipment.reference}
          <StatusBadge status={shipment.status} />
        </DialogTitle>
        <DialogDescription>
          {cityOf(shipment.origin.label)} → {cityOf(shipment.destination.label)}{" "}
          · {shipment.customer} · {MODE_META[shipment.mode].label} ·{" "}
          {shipment.contents}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <div className="mt-1">{item.node}</div>
          </div>
        ))}
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-sm font-semibold">
          Ledger timeline
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {events.length} block{events.length === 1 ? "" : "s"}
          </span>
        </p>
        <ScrollArea className="h-[320px] pr-3">
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No ledger events recorded yet for this shipment.
            </p>
          ) : (
            <ol className="relative space-y-4 pl-5">
              <span
                aria-hidden
                className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border"
              />
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                      STATUS_META[ev.status].dot,
                    )}
                  />
                  <div className="rounded-2xl bg-muted/40 p-3 shadow-clay-inset">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{ev.blockIndex}
                        </span>
                        {STATUS_META[ev.status].label}
                      </span>
                      <Badge variant={integrityVariant(ev.integrityScore)}>
                        {ev.integrityScore}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ev.location} · verified by{" "}
                      <span className="font-medium text-foreground">
                        {ev.verifier}
                      </span>
                    </p>
                    <div className="mt-2">
                      <HashBadge value={ev.hash} label="hash" />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </div>
    </>
  );
}

"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Contact,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Package,
  Receipt,
  FileText,
  CheckCircle2,
  MoreHorizontal,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-collection";
import { shipmentCost } from "@/lib/domain/calc";
import { INVOICE_STATUSES } from "@/config/options";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import type { Customer, Invoice, Shipment, InvoiceStatus } from "@/lib/db/types";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { Field, NativeSelect } from "@/components/form/field";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const INVOICE_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  paid: "success",
  sent: "default",
  overdue: "destructive",
  draft: "muted",
};

// ---------------------------------------------------------------- customer form
const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  company: z.string().optional().default(""),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional()
    .default(""),
  phone: z.string().optional().default(""),
  gstin: z.string().optional().default(""),
  addressLine1: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
});
type CustomerForm = z.infer<typeof customerSchema>;

const EMPTY_CUSTOMER: CustomerForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  gstin: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "",
};

// ---------------------------------------------------------------- invoice form
const invoiceSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  shipmentId: z.string().optional().default(""),
  subtotal: z.coerce.number().min(0, "Subtotal must be ≥ 0"),
  taxAmount: z.coerce.number().min(0, "Tax must be ≥ 0"),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  issuedAt: z.string().min(1, "Issue date is required"),
  dueAt: z.string().min(1, "Due date is required"),
});
type InvoiceForm = z.infer<typeof invoiceSchema>;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <CustomersInner />
    </Suspense>
  );
}

function CustomersInner() {
  const searchParams = useSearchParams();
  const { org } = useAuth();
  const currency = org?.currency ?? "USD";

  const customersCol = useCollection("customers");
  const invoicesCol = useCollection("invoices");
  const shipmentsCol = useCollection("shipments");

  const customers = customersCol.items;
  const invoices = invoicesCol.items;
  const shipments = shipmentsCol.items;

  // dialogs
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(
    null,
  );
  const [detail, setDetail] = React.useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false);
  const [invoiceDeleteTarget, setInvoiceDeleteTarget] =
    React.useState<Invoice | null>(null);

  // ?new=1 → open create customer dialog on mount
  const opened = React.useRef(false);
  React.useEffect(() => {
    if (opened.current) return;
    if (searchParams.get("new") !== null) {
      opened.current = true;
      setEditingCustomer(null);
      setCustomerDialogOpen(true);
    }
  }, [searchParams]);

  function openCreateCustomer() {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  }
  function openEditCustomer(c: Customer) {
    setEditingCustomer(c);
    setCustomerDialogOpen(true);
  }

  // per-customer aggregates
  function shipmentCountFor(id: string): number {
    return shipments.filter((s) => s.customerId === id).length;
  }
  function billedFor(id: string): number {
    return invoices
      .filter(
        (i) =>
          i.customerId === id && (i.status === "paid" || i.status === "sent"),
      )
      .reduce((sum, i) => sum + i.total, 0);
  }

  function confirmDeleteCustomer() {
    if (!deleteTarget) return;
    customersCol.remove(deleteTarget.id, `Deleted customer ${deleteTarget.name}`);
    toast.success("Customer deleted");
    setDeleteTarget(null);
  }

  function confirmDeleteInvoice() {
    if (!invoiceDeleteTarget) return;
    invoicesCol.remove(
      invoiceDeleteTarget.id,
      `Deleted invoice ${invoiceDeleteTarget.number}`,
    );
    toast.success("Invoice deleted");
    setInvoiceDeleteTarget(null);
  }

  function markInvoicePaid(inv: Invoice) {
    invoicesCol.edit(inv.id, { status: "paid" }, `Marked ${inv.number} paid`);
    toast.success(`${inv.number} marked as paid`);
  }

  // invoice summary strip
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Customers"
          description="Manage your customer accounts and their invoices."
        >
          <Button onClick={openCreateCustomer}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        </PageHeader>
      </FadeIn>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* --------------------------------------------------- Customers */}
        <TabsContent value="customers">
          {customers.length === 0 ? (
            <FadeIn>
              <EmptyState
                icon={Contact}
                title="Add your first customer"
                description="Customers you add here can be linked to shipments and invoices."
                action={
                  <Button onClick={openCreateCustomer}>
                    <Plus className="h-4 w-4" />
                    Add customer
                  </Button>
                }
              />
            </FadeIn>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {customers.map((c) => (
                <StaggerItem key={c.id}>
                  <Card className="flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setDetail(c)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        aria-label={`View ${c.name}`}
                      >
                        <Avatar className="h-12 w-12 shadow-clay-sm">
                          <AvatarFallback>{initials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{c.name}</p>
                          {c.company && (
                            <p className="truncate text-sm text-muted-foreground">
                              {c.company}
                            </p>
                          )}
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${c.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{c.name}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditCustomer(c)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      {c.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </p>
                      )}
                      {c.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.phone}</span>
                        </p>
                      )}
                      {(c.city || c.country) && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[c.city, c.country].filter(Boolean).join(", ")}
                          </span>
                        </p>
                      )}
                      {c.gstin && (
                        <p className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">GSTIN {c.gstin}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                        <p className="text-xs text-muted-foreground">
                          Shipments
                        </p>
                        <p className="mt-0.5 text-lg font-bold">
                          {shipmentCountFor(c.id)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                        <p className="text-xs text-muted-foreground">
                          Total billed
                        </p>
                        <p className="mt-0.5 text-lg font-bold">
                          {formatCurrency(billedFor(c.id), currency)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </TabsContent>

        {/* ---------------------------------------------------- Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          {invoices.length === 0 ? (
            <FadeIn>
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="No invoices yet — create one from a customer or here."
                action={
                  <Button
                    onClick={() => setInvoiceDialogOpen(true)}
                    disabled={customers.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    New invoice
                  </Button>
                }
              />
            </FadeIn>
          ) : (
            <>
              <FadeIn>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total billed
                      </p>
                      <p className="mt-0.5 text-xl font-bold">
                        {formatCurrency(totalBilled, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="mt-0.5 text-xl font-bold text-success">
                        {formatCurrency(totalPaid, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-warning">
                        {formatCurrency(totalOutstanding, currency)}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setInvoiceDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    New invoice
                  </Button>
                </div>
              </FadeIn>

              <FadeIn delay={0.05}>
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            {inv.number}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {customerName(inv.customerId)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(inv.total, currency)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={INVOICE_VARIANT[inv.status]}
                              className="capitalize"
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(inv.issuedAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(inv.dueAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${inv.number}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  {inv.number}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={inv.status === "paid"}
                                  onClick={() => markInvoicePaid(inv)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Mark paid
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10"
                                  onClick={() => setInvoiceDeleteTarget(inv)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </FadeIn>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------- Customer create/edit */}
      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        editing={editingCustomer}
        onCreate={(data) => {
          customersCol.add(data, `Added customer ${data.name}`);
          toast.success("Customer added");
        }}
        onEdit={(id, data) => {
          customersCol.edit(id, data, `Updated customer ${data.name}`);
          toast.success("Customer updated");
        }}
      />

      {/* ------------------------------------------------ Invoice create */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        customers={customers}
        shipments={shipments}
        currency={currency}
        onCreate={(data) => {
          const number = `INV-${1000 + invoices.length}`;
          invoicesCol.add(
            { ...data, number },
            `Created invoice ${number}`,
          );
          toast.success(`Invoice ${number} created`);
        }}
      />

      {/* ------------------------------------------------ Customer detail */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {detail.company || "Customer account overview"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Shipments</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {shipmentCountFor(detail.id)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Billed</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {formatCurrency(billedFor(detail.id), currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {invoices.filter((i) => i.customerId === detail.id).length}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Recent shipments
                </p>
                {shipments.filter((s) => s.customerId === detail.id).length >
                0 ? (
                  <div className="space-y-2">
                    {shipments
                      .filter((s) => s.customerId === detail.id)
                      .slice(0, 5)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-2.5 shadow-clay-inset"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{s.reference}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[s.destinationCity, s.destinationCountry]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipments for this customer yet.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Invoices
                </p>
                {invoices.filter((i) => i.customerId === detail.id).length >
                0 ? (
                  <div className="space-y-2">
                    {invoices
                      .filter((i) => i.customerId === detail.id)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-2.5 shadow-clay-inset"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{inv.number}</p>
                            <p className="text-xs text-muted-foreground">
                              Due {formatDate(inv.dueAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {formatCurrency(inv.total, currency)}
                            </span>
                            <Badge
                              variant={INVOICE_VARIANT[inv.status]}
                              className="capitalize"
                            >
                              {inv.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No invoices for this customer yet.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------- Delete confirmations */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete customer?</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget?.name}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={invoiceDeleteTarget !== null}
        onOpenChange={(o) => !o && setInvoiceDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete invoice?</DialogTitle>
            <DialogDescription>
              Delete {invoiceDeleteTarget?.number}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInvoiceDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteInvoice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------ CustomerDialog
function CustomerDialog({
  open,
  onOpenChange,
  editing,
  onCreate,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Customer | null;
  onCreate: (data: Omit<Customer, "id" | "orgId" | "createdAt">) => void;
  onEdit: (id: string, data: Omit<Customer, "id" | "orgId" | "createdAt">) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: EMPTY_CUSTOMER,
  });

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        name: editing.name,
        company: editing.company,
        email: editing.email,
        phone: editing.phone,
        gstin: editing.gstin,
        addressLine1: editing.addressLine1,
        city: editing.city,
        state: editing.state,
        country: editing.country,
      });
    } else {
      reset(EMPTY_CUSTOMER);
    }
  }, [open, editing, reset]);

  const submit = handleSubmit((values) => {
    const data: Omit<Customer, "id" | "orgId" | "createdAt"> = {
      name: values.name.trim(),
      company: values.company ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
      gstin: values.gstin ?? "",
      addressLine1: values.addressLine1 ?? "",
      city: values.city ?? "",
      state: values.state ?? "",
      country: values.country ?? "",
    };
    if (editing) onEdit(editing.id, data);
    else onCreate(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit customer" : "Add customer"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this customer's details."
              : "Create a new customer record."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" htmlFor="c-name" required error={errors.name?.message}>
            <Input id="c-name" {...register("name")} placeholder="Jane Doe" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="c-company">
              <Input
                id="c-company"
                {...register("company")}
                placeholder="Acme Corp"
              />
            </Field>
            <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
              <Input
                id="c-email"
                type="email"
                {...register("email")}
                placeholder="jane@acme.com"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="c-phone">
              <Input
                id="c-phone"
                {...register("phone")}
                placeholder="+1 555 0100"
              />
            </Field>
            <Field label="GSTIN / Tax ID" htmlFor="c-gstin">
              <Input id="c-gstin" {...register("gstin")} />
            </Field>
          </div>
          <Field label="Address" htmlFor="c-addr">
            <Input
              id="c-addr"
              {...register("addressLine1")}
              placeholder="123 Market St"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="c-city">
              <Input id="c-city" {...register("city")} />
            </Field>
            <Field label="State" htmlFor="c-state">
              <Input id="c-state" {...register("state")} />
            </Field>
            <Field label="Country" htmlFor="c-country">
              <Input id="c-country" {...register("country")} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editing ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- InvoiceDialog
function InvoiceDialog({
  open,
  onOpenChange,
  customers,
  shipments,
  currency,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customers: Customer[];
  shipments: Shipment[];
  currency: string;
  onCreate: (data: Omit<Invoice, "id" | "orgId" | "number">) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      shipmentId: "",
      subtotal: 0,
      taxAmount: 0,
      status: "draft",
      issuedAt: todayISO(),
      dueAt: todayISO(),
    },
  });

  const [taxPct, setTaxPct] = React.useState("");

  React.useEffect(() => {
    if (open) {
      reset({
        customerId: customers[0]?.id ?? "",
        shipmentId: "",
        subtotal: 0,
        taxAmount: 0,
        status: "draft",
        issuedAt: todayISO(),
        dueAt: todayISO(),
      });
      setTaxPct("");
    }
  }, [open, reset, customers]);

  const customerId = watch("customerId");
  const shipmentId = watch("shipmentId");
  const subtotal = Number(watch("subtotal")) || 0;
  const taxAmount = Number(watch("taxAmount")) || 0;

  const customerShipments = React.useMemo(
    () => shipments.filter((s) => s.customerId === customerId),
    [shipments, customerId],
  );

  // prefill subtotal when a shipment is selected
  function handleShipmentChange(id: string) {
    setValue("shipmentId", id);
    if (id) {
      const s = shipments.find((sh) => sh.id === id);
      if (s) {
        const cost = shipmentCost(s);
        setValue("subtotal", cost.subtotal);
        if (taxPct) {
          const pct = Number(taxPct) || 0;
          setValue("taxAmount", Math.round(cost.subtotal * (pct / 100) * 100) / 100);
        }
      }
    }
  }

  function applyTaxPct(pctRaw: string) {
    setTaxPct(pctRaw);
    const pct = Number(pctRaw);
    if (Number.isFinite(pct) && pctRaw !== "") {
      setValue("taxAmount", Math.round(subtotal * (pct / 100) * 100) / 100);
    }
  }

  const submit = handleSubmit((values) => {
    const data: Omit<Invoice, "id" | "orgId" | "number"> = {
      customerId: values.customerId,
      shipmentId: values.shipmentId ? values.shipmentId : null,
      subtotal: values.subtotal,
      taxAmount: values.taxAmount,
      total: values.subtotal + values.taxAmount,
      status: values.status,
      issuedAt: values.issuedAt,
      dueAt: values.dueAt,
    };
    onCreate(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Create an invoice for one of your customers.
          </DialogDescription>
        </DialogHeader>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add a customer before creating an invoice."
          />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Customer"
              htmlFor="i-customer"
              required
              error={errors.customerId?.message}
            >
              <NativeSelect id="i-customer" {...register("customerId")}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Shipment (optional)" htmlFor="i-shipment">
              <NativeSelect
                id="i-shipment"
                value={shipmentId}
                onChange={(e) => handleShipmentChange(e.target.value)}
              >
                <option value="">None</option>
                {customerShipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.reference} — {s.destinationCity}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Subtotal"
                htmlFor="i-subtotal"
                required
                error={errors.subtotal?.message}
              >
                <Input
                  id="i-subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("subtotal")}
                />
              </Field>
              <Field label="Tax %" htmlFor="i-taxpct" hint="optional">
                <Input
                  id="i-taxpct"
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxPct}
                  onChange={(e) => applyTaxPct(e.target.value)}
                  placeholder="e.g. 18"
                />
              </Field>
              <Field
                label="Tax amount"
                htmlFor="i-tax"
                error={errors.taxAmount?.message}
              >
                <Input
                  id="i-tax"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("taxAmount")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status" htmlFor="i-status">
                <NativeSelect id="i-status" {...register("status")}>
                  {INVOICE_STATUSES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field
                label="Issued"
                htmlFor="i-issued"
                error={errors.issuedAt?.message}
              >
                <Input id="i-issued" type="date" {...register("issuedAt")} />
              </Field>
              <Field
                label="Due"
                htmlFor="i-due"
                error={errors.dueAt?.message}
              >
                <Input id="i-due" type="date" {...register("dueAt")} />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 shadow-clay-inset">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold">
                {formatCurrency(subtotal + taxAmount, currency)}
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create invoice</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

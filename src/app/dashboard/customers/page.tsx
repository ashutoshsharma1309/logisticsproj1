"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  DollarSign,
  Smile,
  Plus,
  MoreHorizontal,
  Eye,
  Download,
  BellRing,
  LifeBuoy,
  Mail,
  MessageSquareText,
  Send,
  Truck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogHeader,
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
import { getStore } from "@/services/store";
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
} from "@/lib/utils";
import type { Customer, Invoice } from "@/types";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];
type TierVariant = BadgeVariant;
type InvoiceVariant = BadgeVariant;

const TIER_VARIANT: Record<Customer["tier"], TierVariant> = {
  enterprise: "accent",
  business: "default",
  starter: "muted",
};

const INVOICE_VARIANT: Record<Invoice["status"], InvoiceVariant> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  draft: "muted",
};

interface SupportTicket {
  id: string;
  subject: string;
  priority: "low" | "medium" | "high";
  status: "open" | "pending" | "resolved";
  updated: string;
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "TCK-4821",
    subject: "Customs hold on CR-2026012 — need documents",
    priority: "high",
    status: "open",
    updated: "2h ago",
  },
  {
    id: "TCK-4809",
    subject: "Invoice INV-2026-1044 line item dispute",
    priority: "medium",
    status: "pending",
    updated: "5h ago",
  },
  {
    id: "TCK-4788",
    subject: "Request API rate-limit increase for webhooks",
    priority: "low",
    status: "resolved",
    updated: "1d ago",
  },
  {
    id: "TCK-4771",
    subject: "Cold-chain telemetry export for Q2 shipments",
    priority: "medium",
    status: "resolved",
    updated: "2d ago",
  },
];

const TICKET_VARIANT: Record<SupportTicket["status"], InvoiceVariant> = {
  open: "warning",
  pending: "default",
  resolved: "success",
};

const PRIORITY_VARIANT: Record<SupportTicket["priority"], InvoiceVariant> = {
  high: "destructive",
  medium: "warning",
  low: "muted",
};

interface StatItem {
  label: string;
  value: string;
  icon: typeof Users;
  accent: string;
}

function KpiStat({ item, delay }: { item: StatItem; delay: number }) {
  const Icon = item.icon;
  return (
    <FadeIn delay={delay}>
      <Card className="group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl shadow-clay-inset",
              item.accent,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{item.value}</p>
      </Card>
    </FadeIn>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const { customers, invoices, shipments } = getStore();

  const [tier, setTier] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const [trackRef, setTrackRef] = React.useState("");

  const visibleCustomers = React.useMemo(
    () =>
      tier === "all"
        ? customers
        : customers.filter((c) => c.tier === tier),
    [customers, tier],
  );

  const totalActive = customers.reduce((sum, c) => sum + c.activeShipments, 0);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const avgSatisfaction =
    customers.reduce((sum, c) => sum + c.satisfaction, 0) / customers.length;

  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const pending = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + i.amount, 0);
  const overdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

  const stats: StatItem[] = [
    {
      label: "Total customers",
      value: formatNumber(customers.length),
      icon: Users,
      accent: "bg-primary/12 text-primary",
    },
    {
      label: "Active shipments",
      value: formatNumber(totalActive),
      icon: Package,
      accent: "bg-secondary/15 text-secondary",
    },
    {
      label: "Total revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      accent: "bg-success/15 text-success",
    },
    {
      label: "Avg satisfaction",
      value: `${avgSatisfaction.toFixed(1)}%`,
      icon: Smile,
      accent: "bg-accent/15 text-accent",
    },
  ];

  const detailShipments = selected
    ? shipments.filter((s) => s.customer === selected.company).slice(0, 4)
    : [];
  const detailInvoices = selected
    ? invoices.filter((i) => i.customer === selected.company)
    : [];

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (trackRef.trim()) {
      toast.success(`Locating ${trackRef.trim()}…`, {
        description: "Opening the live shipments board.",
      });
      router.push("/dashboard/shipments");
    } else {
      toast.error("Enter a shipment reference to track.");
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Customers"
          description="Manage accounts, billing, and support for every shipper on ChainRoute."
        >
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by tier">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() =>
              toast.success("Add customer", {
                description: "Customer onboarding flow launched.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        </PageHeader>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, i) => (
          <KpiStat key={item.label} item={item} delay={i * 0.06} />
        ))}
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------- Customers */}
        <TabsContent value="customers">
          <StaggerGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCustomers.map((c) => (
              <StaggerItem key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c)}
                  className="w-full text-left"
                >
                  <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shadow-clay-sm">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback>{initials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {c.company}
                        </p>
                      </div>
                      <Badge
                        variant={TIER_VARIANT[c.tier]}
                        className="capitalize"
                      >
                        {c.tier}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                        <p className="text-xs text-muted-foreground">
                          Active shipments
                        </p>
                        <p className="mt-0.5 text-lg font-bold">
                          {c.activeShipments}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3 shadow-clay-inset">
                        <p className="text-xs text-muted-foreground">
                          Total spend
                        </p>
                        <p className="mt-0.5 text-lg font-bold">
                          {formatCurrency(c.totalSpend)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Satisfaction
                        </span>
                        <span className="font-semibold">{c.satisfaction}%</span>
                      </div>
                      <Progress value={c.satisfaction} />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Member since {formatDate(c.since)}</span>
                      {c.outstandingInvoices > 0 ? (
                        <Badge variant="warning">
                          {c.outstandingInvoices} outstanding
                        </Badge>
                      ) : (
                        <Badge variant="success">Settled</Badge>
                      )}
                    </div>
                  </Card>
                </button>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </TabsContent>

        {/* --------------------------------------------------- Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <FadeIn>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total billed", value: billed, tone: "text-foreground" },
                { label: "Paid", value: paid, tone: "text-success" },
                { label: "Pending", value: pending, tone: "text-warning" },
                { label: "Overdue", value: overdue, tone: "text-destructive" },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("mt-1 text-xl font-bold", s.tone)}>
                    {formatCurrency(s.value)}
                  </p>
                </Card>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.customer}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(inv.amount)}
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
                        {formatDate(inv.issued)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.due)}
                      </TableCell>
                      <TableCell className="text-center">{inv.items}</TableCell>
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
                            <DropdownMenuLabel>{inv.number}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(`Viewing ${inv.number}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.success(`Downloading ${inv.number}.pdf`)
                              }
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.success("Reminder sent", {
                                  description: `${inv.customer} was notified about ${inv.number}.`,
                                })
                              }
                            >
                              <BellRing className="h-4 w-4" />
                              Send reminder
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
        </TabsContent>

        {/* ---------------------------------------------------- Support */}
        <TabsContent value="support">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <FadeIn className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    Open a support ticket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success("Ticket submitted", {
                        description: "Our support team will respond within 2 hours.",
                      });
                      (e.target as HTMLFormElement).reset();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="ticket-subject">Subject</Label>
                      <Input
                        id="ticket-subject"
                        placeholder="Briefly describe the issue"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ticket-priority">Priority</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger id="ticket-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ticket-message">Message</Label>
                      <Textarea
                        id="ticket-message"
                        placeholder="Give us the full details so we can help fast…"
                        required
                      />
                    </div>
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                      Submit ticket
                    </Button>
                  </form>

                  <Separator className="my-6" />

                  <p className="mb-3 text-sm font-semibold">Recent tickets</p>
                  <div className="space-y-3">
                    {MOCK_TICKETS.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3 shadow-clay-inset"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {t.subject}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t.id} · updated {t.updated}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge
                            variant={TICKET_VARIANT[t.status]}
                            className="capitalize"
                          >
                            {t.status}
                          </Badge>
                          <Badge
                            variant={PRIORITY_VARIANT[t.priority]}
                            className="capitalize"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.08} className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-secondary" />
                    Track a shipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTrack} className="space-y-3">
                    <Input
                      value={trackRef}
                      onChange={(e) => setTrackRef(e.target.value)}
                      placeholder="e.g. CR-2026041"
                      aria-label="Shipment reference"
                    />
                    <Button type="submit" variant="secondary" className="w-full">
                      Track shipment
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-accent" />
                    Notification preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      label: "Email updates",
                      desc: "Delivery and exception alerts",
                      def: true,
                    },
                    {
                      icon: MessageSquareText,
                      label: "SMS alerts",
                      desc: "Critical delays only",
                      def: false,
                    },
                    {
                      icon: BellRing,
                      label: "Push notifications",
                      desc: "Real-time milestone pings",
                      def: true,
                    },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/50 text-muted-foreground shadow-clay-inset">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{row.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.desc}
                            </p>
                          </div>
                        </div>
                        <Switch
                          defaultChecked={row.def}
                          onCheckedChange={(v) =>
                            toast.success(
                              `${row.label} ${v ? "enabled" : "disabled"}`,
                            )
                          }
                          aria-label={row.label}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------ Customer detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Customer detail</DialogTitle>
                <DialogDescription>
                  Account overview and recent activity.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 shadow-clay-sm">
                  <AvatarImage src={selected.avatar} alt={selected.name} />
                  <AvatarFallback>{initials(selected.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.company}
                  </p>
                </div>
                <Badge
                  variant={TIER_VARIANT[selected.tier]}
                  className="capitalize"
                >
                  {selected.tier}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Spend</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {formatCurrency(selected.totalSpend)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {selected.satisfaction}%
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center shadow-clay-inset">
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <p className="mt-0.5 text-sm font-bold">
                    {detailInvoices.length}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Recent shipments
                </p>
                {detailShipments.length > 0 ? (
                  <div className="space-y-2">
                    {detailShipments.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-2.5 shadow-clay-inset"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{s.reference}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.origin.label} → {s.destination.label}
                          </p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recent shipments on record.
                  </p>
                )}
              </div>

              <p className="rounded-xl bg-primary/10 p-3 text-xs text-muted-foreground">
                <Truck className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                Track any shipment live from the Shipments board — every
                milestone is verified on the decentralized ledger.
              </p>

              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(null);
                  router.push("/dashboard/shipments");
                }}
              >
                Track shipment
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

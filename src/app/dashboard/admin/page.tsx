"use client";

import * as React from "react";
import {
  Users,
  Package,
  Boxes,
  Activity,
  Gauge,
  UserPlus,
  Search,
  MoreHorizontal,
  ShieldCheck,
  Ban,
  Trash2,
  Cpu,
  MemoryStick,
  Link2,
  Timer,
  AlertTriangle,
  RefreshCw,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { RadialGauge } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
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
import { getStore } from "@/services/store";
import { DEMO_USER, ROLE_LABELS } from "@/config/user";
import { cn, formatNumber, formatDateTime, relativeTime } from "@/lib/utils";
import type { UserRole, User, ActivityLog } from "@/types";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Fixed reference "now" so derived last-active times are deterministic. */
const NOW_REF = new Date("2026-07-04T12:00:00.000Z").getTime();
const HOUR = 3_600_000;

const ROLE_VARIANT: Record<UserRole, BadgeVariant> = {
  admin: "destructive",
  manager: "default",
  warehouse: "secondary",
  driver: "accent",
  customer: "muted",
};

const USER_STATUS_VARIANT: Record<User["status"], BadgeVariant> = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
};

const LOG_VARIANT: Record<ActivityLog["type"], BadgeVariant> = {
  create: "success",
  update: "default",
  delete: "destructive",
  verify: "secondary",
  alert: "warning",
  login: "muted",
};

const ROLES: UserRole[] = ["admin", "manager", "warehouse", "driver", "customer"];

const PERMISSIONS: { key: string; label: string; defaults: Record<UserRole, boolean> }[] = [
  {
    key: "view_shipments",
    label: "View shipments",
    defaults: { admin: true, manager: true, warehouse: true, driver: true, customer: true },
  },
  {
    key: "edit_shipments",
    label: "Edit shipments",
    defaults: { admin: true, manager: true, warehouse: true, driver: false, customer: false },
  },
  {
    key: "manage_fleet",
    label: "Manage fleet",
    defaults: { admin: true, manager: true, warehouse: false, driver: false, customer: false },
  },
  {
    key: "access_ledger",
    label: "Access ledger",
    defaults: { admin: true, manager: true, warehouse: false, driver: false, customer: false },
  },
  {
    key: "manage_users",
    label: "Manage users",
    defaults: { admin: true, manager: false, warehouse: false, driver: false, customer: false },
  },
  {
    key: "billing",
    label: "Billing",
    defaults: { admin: true, manager: true, warehouse: false, driver: false, customer: true },
  },
  {
    key: "ai_insights",
    label: "AI insights",
    defaults: { admin: true, manager: true, warehouse: true, driver: false, customer: false },
  },
];

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: User["status"];
  lastActive: string;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}

interface StatItem {
  label: string;
  value: string;
  icon: typeof Users;
  accent: string;
}

function StatCard({ item, delay }: { item: StatItem; delay: number }) {
  const Icon = item.icon;
  return (
    <FadeIn delay={delay}>
      <Card className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl shadow-clay-inset",
            item.accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{item.value}</p>
      </Card>
    </FadeIn>
  );
}

export default function AdminPage() {
  const { customers, drivers, shipments, ledger, activity } = getStore();

  const [query, setQuery] = React.useState("");
  const [logType, setLogType] = React.useState("all");

  const users: AdminUserRow[] = React.useMemo(() => {
    const rows: AdminUserRow[] = [
      {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
        status: DEMO_USER.status,
        lastActive: DEMO_USER.lastActive,
      },
    ];
    drivers.forEach((d, i) => {
      const status: User["status"] =
        d.status === "off_duty" ? "suspended" : d.status === "resting" ? "invited" : "active";
      rows.push({
        id: d.id,
        name: d.name,
        email: `${slug(d.name)}@fleet.chainroute.ai`,
        role: "driver",
        status,
        lastActive: new Date(NOW_REF - (i + 1) * 3 * HOUR).toISOString(),
      });
    });
    customers.forEach((c, i) => {
      rows.push({
        id: c.id,
        name: c.name,
        email: `${slug(c.name)}@${slug(c.company)}.com`,
        role: "customer",
        status: c.outstandingInvoices > 4 ? "suspended" : "active",
        lastActive: new Date(NOW_REF - (i + 2) * 7 * HOUR).toISOString(),
      });
    });
    return rows;
  }, [customers, drivers]);

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        ROLE_LABELS[u.role].toLowerCase().includes(q),
    );
  }, [users, query]);

  const filteredLogs = React.useMemo(
    () =>
      logType === "all"
        ? activity
        : activity.filter((a) => a.type === logType),
    [activity, logType],
  );

  const activeShipments = shipments.filter(
    (s) => s.status !== "delivered",
  ).length;

  const stats: StatItem[] = [
    {
      label: "Total users",
      value: formatNumber(customers.length + drivers.length + 1284),
      icon: Users,
      accent: "bg-primary/12 text-primary",
    },
    {
      label: "Active shipments",
      value: formatNumber(activeShipments),
      icon: Package,
      accent: "bg-secondary/15 text-secondary",
    },
    {
      label: "Ledger blocks",
      value: formatNumber(ledger.length),
      icon: Boxes,
      accent: "bg-accent/15 text-accent",
    },
    {
      label: "System uptime",
      value: "99.98%",
      icon: Activity,
      accent: "bg-success/15 text-success",
    },
    {
      label: "API calls today",
      value: formatNumber(1284920),
      icon: Gauge,
      accent: "bg-warning/20 text-warning",
    },
  ];

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Admin Console"
          description="Govern users, permissions, audit logs, and platform health across ChainRoute."
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4" />
                Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
                <DialogDescription>
                  They&apos;ll receive an email invitation to join your workspace.
                </DialogDescription>
              </DialogHeader>
              <form
                id="invite-form"
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Invitation sent", {
                    description: "The user will appear as “invited” until they accept.",
                  });
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select defaultValue="manager">
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit" form="invite-form">
                    Send invite
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageHeader>
      </FadeIn>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((item, i) => (
          <StatCard key={item.label} item={item} delay={i * 0.05} />
        ))}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------- Users */}
        <TabsContent value="users" className="space-y-4">
          <FadeIn>
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users, emails, roles…"
                className="pl-10"
                aria-label="Search users"
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={USER_STATUS_VARIANT[u.status]}
                          className="capitalize"
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {relativeTime(u.lastActive)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${u.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{u.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(`Editing role for ${u.name}`)
                              }
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Edit role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.warning(`${u.name} suspended`)
                              }
                            >
                              <Ban className="h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() =>
                                toast.error(`${u.name} deleted`)
                              }
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
        </TabsContent>

        {/* ------------------------------------------------- Permissions */}
        <TabsContent value="permissions">
          <FadeIn>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Role &amp; permission matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      {ROLES.map((r) => (
                        <TableHead key={r} className="text-center">
                          {ROLE_LABELS[r]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSIONS.map((p) => (
                      <TableRow key={p.key}>
                        <TableCell className="font-medium">{p.label}</TableCell>
                        {ROLES.map((r) => (
                          <TableCell key={r} className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                defaultChecked={p.defaults[r]}
                                aria-label={`${p.label} for ${ROLE_LABELS[r]}`}
                                onCheckedChange={(v) =>
                                  toast.success(
                                    `${p.label} · ${ROLE_LABELS[r]} ${v ? "granted" : "revoked"}`,
                                  )
                                }
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* -------------------------------------------------------- Logs */}
        <TabsContent value="logs" className="space-y-4">
          <FadeIn>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[180px]" aria-label="Filter logs by type">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="verify">Verify</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge
                          variant={LOG_VARIANT[a.type]}
                          className="capitalize"
                        >
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{a.actor}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.action}{" "}
                        <span className="font-medium text-foreground">
                          {a.target}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(a.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* ---------------------------------------------------- Platform */}
        <TabsContent value="platform" className="space-y-6">
          <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "CPU load", value: 42, icon: Cpu, color: "hsl(var(--primary))" },
              { label: "Memory", value: 63, icon: MemoryStick, color: "hsl(var(--secondary))" },
              { label: "Ledger sync", value: 99, icon: Link2, color: "hsl(var(--success))" },
            ].map((g) => {
              const Icon = g.icon;
              return (
                <StaggerItem key={g.label}>
                  <Card className="flex flex-col items-center p-5">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      {g.label}
                    </div>
                    <RadialGauge value={g.value} color={g.color} size={150} />
                  </Card>
                </StaggerItem>
              );
            })}
            <StaggerItem>
              <Card className="flex h-full flex-col justify-center p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  API latency (p95)
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight">128 ms</p>
                <Progress value={64} className="mt-4" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Target &lt; 200 ms · well within SLA
                </p>
              </Card>
            </StaggerItem>
          </StaggerGroup>

          <FadeIn delay={0.1}>
            <Card className="border border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DangerAction
                  icon={RefreshCw}
                  title="Reset demo data"
                  description="Regenerate all shipments, ledger blocks, and accounts from seed."
                  confirmLabel="Reset data"
                  onConfirm={() =>
                    toast.success("Demo data reset", {
                      description: "All datasets were regenerated from the seed.",
                    })
                  }
                />
                <Separator />
                <DangerAction
                  icon={Eraser}
                  title="Purge audit logs"
                  description="Permanently delete every activity log entry. This cannot be undone."
                  confirmLabel="Purge logs"
                  onConfirm={() =>
                    toast.success("Audit logs purged", {
                      description: "The activity history was cleared.",
                    })
                  }
                />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DangerAction({
  icon: Icon,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  icon: typeof RefreshCw;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="shrink-0">
            {confirmLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}?</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Package,
  Warehouse as WarehouseIcon,
  Truck,
  Boxes,
  UserPlus,
  Search,
  MoreHorizontal,
  ShieldCheck,
  Ban,
  Play,
  History,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useCollection } from "@/hooks/use-collection";
import { useOrgData } from "@/hooks/use-org-data";
import {
  listAccounts,
  createAccount,
  updateAccount,
} from "@/lib/auth/accounts";
import { ROLES, INDUSTRIES, CURRENCIES } from "@/config/options";
import { ROLE_LABELS } from "@/config/user";
import { relativeTime, formatDate, formatDateTime } from "@/lib/utils";
import type { Account, AuditLog, UserRole } from "@/lib/db/types";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { Field, NativeSelect } from "@/components/form/field";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const ROLE_VARIANT: Record<UserRole, BadgeVariant> = {
  admin: "destructive",
  manager: "default",
  warehouse: "secondary",
  driver: "accent",
  customer: "muted",
};

const STATUS_VARIANT: Record<Account["status"], BadgeVariant> = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
};

const AUDIT_VARIANT: Record<AuditLog["action"], BadgeVariant> = {
  create: "success",
  update: "default",
  delete: "destructive",
  verify: "secondary",
  login: "muted",
  settings: "accent",
};

const AUDIT_ACTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "verify", label: "Verify" },
  { value: "login", label: "Login" },
  { value: "settings", label: "Settings" },
];

// ----------------------------------------------------------------- invite form
const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["admin", "manager", "warehouse", "driver", "customer"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <AdminInner />
    </Suspense>
  );
}

function AdminInner() {
  const searchParams = useSearchParams();
  const { account, org, orgId, updateOrganization } = useAuth();

  const auditCol = useCollection("audit");
  const ledgerCol = useCollection("ledger");
  const { shipments, warehouses, vehicles } = useOrgData();

  // listAccounts is not reactive — re-read on tick bumps
  const [tick, setTick] = React.useState(0);
  /* eslint-disable-next-line react-hooks/exhaustive-deps -- tick intentionally forces a re-read of the non-reactive listAccounts() */
  const users = React.useMemo(() => (orgId ? listAccounts(orgId) : []), [orgId, tick]);
  const bump = () => setTick((t) => t + 1);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [auditFilter, setAuditFilter] = React.useState("all");

  // ?new=1 → open invite dialog on mount
  const opened = React.useRef(false);
  React.useEffect(() => {
    if (opened.current) return;
    if (searchParams.get("new") !== null) {
      opened.current = true;
      setInviteOpen(true);
    }
  }, [searchParams]);

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

  const filteredAudit = React.useMemo(() => {
    const items = [...auditCol.items].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return auditFilter === "all"
      ? items
      : items.filter((a) => a.action === auditFilter);
  }, [auditCol.items, auditFilter]);

  function handleInvite(values: InviteForm) {
    if (!orgId) {
      toast.error("No organization found.");
      return;
    }
    const password = Math.random().toString(36).slice(2, 12);
    createAccount({
      orgId,
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      status: "invited",
      password,
    });
    bump();
    toast.success("Invitation sent", {
      description: `${values.name} was added as ${ROLE_LABELS[values.role]}.`,
    });
    setInviteOpen(false);
  }

  function changeRole(u: Account, role: UserRole) {
    if (role === u.role) return;
    updateAccount(u.id, { role });
    bump();
    toast.success(`${u.name} is now ${ROLE_LABELS[role]}`);
  }

  function toggleStatus(u: Account) {
    const next: Account["status"] =
      u.status === "suspended" ? "active" : "suspended";
    updateAccount(u.id, { status: next });
    bump();
    toast.success(
      next === "suspended" ? `${u.name} suspended` : `${u.name} activated`,
    );
  }

  const metrics = [
    { label: "Team members", value: users.length, icon: Users },
    { label: "Shipments", value: shipments.length, icon: Package },
    { label: "Warehouses", value: warehouses.length, icon: WarehouseIcon },
    { label: "Vehicles", value: vehicles.length, icon: Truck },
    { label: "Ledger blocks", value: ledgerCol.items.length, icon: Boxes },
  ];

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Admin Console"
          description="Manage your team, organization profile, and activity history."
        >
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        </PageHeader>
      </FadeIn>

      {/* Platform metrics */}
      <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <StaggerItem key={m.label}>
              <Card className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {m.value}
                </p>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------------- Team */}
        <TabsContent value="team" className="space-y-4">
          <FadeIn>
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search team members…"
                className="pl-10"
                aria-label="Search team members"
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={query ? "No matching members" : "No team members yet"}
                description={
                  query
                    ? "Try a different search."
                    : "Invite a colleague to collaborate in your workspace."
                }
                action={
                  !query ? (
                    <Button onClick={() => setInviteOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                      Invite user
                    </Button>
                  ) : undefined
                }
              />
            ) : (
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
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === account?.id;
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </TableCell>
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
                              variant={STATUS_VARIANT[u.status]}
                              className="capitalize"
                            >
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {relativeTime(u.lastActiveAt)}
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
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4" />
                                  Change role
                                </DropdownMenuLabel>
                                {ROLES.map((r) => (
                                  <DropdownMenuItem
                                    key={r.value}
                                    disabled={r.value === u.role}
                                    onClick={() => changeRole(u, r.value)}
                                  >
                                    {r.label}
                                    {r.value === u.role && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        current
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={isSelf}
                                  className={
                                    u.status === "suspended"
                                      ? ""
                                      : "text-destructive focus:bg-destructive/10"
                                  }
                                  onClick={() => toggleStatus(u)}
                                >
                                  {u.status === "suspended" ? (
                                    <>
                                      <Play className="h-4 w-4" />
                                      Activate
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4" />
                                      Suspend
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </FadeIn>
        </TabsContent>

        {/* ------------------------------------------------ Organization */}
        <TabsContent value="organization">
          <FadeIn>
            <OrganizationForm
              key={org?.id ?? "none"}
              onSave={(patch) => {
                updateOrganization(patch);
                toast.success("Organization updated");
              }}
              created={org?.createdAt ?? ""}
              defaults={{
                name: org?.name ?? "",
                legalName: org?.legalName ?? "",
                industry: org?.industry ?? "",
                currency: org?.currency ?? "USD",
                gstin: org?.gstin ?? "",
                phone: org?.phone ?? "",
                website: org?.website ?? "",
                addressLine1: org?.addressLine1 ?? "",
                city: org?.city ?? "",
                state: org?.state ?? "",
                country: org?.country ?? "",
                postalCode: org?.postalCode ?? "",
              }}
            />
          </FadeIn>
        </TabsContent>

        {/* --------------------------------------------------- Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <FadeIn>
            <NativeSelect
              className="w-[180px]"
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              aria-label="Filter audit log by type"
            >
              {AUDIT_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </NativeSelect>
          </FadeIn>

          <FadeIn delay={0.05}>
            {filteredAudit.length === 0 ? (
              <EmptyState
                icon={History}
                title="No activity logged yet"
                description="Actions across your workspace will appear here."
              />
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge
                            variant={AUDIT_VARIANT[a.action]}
                            className="capitalize"
                          >
                            {a.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {a.actorName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.summary}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {a.entity}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(a.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* --------------------------------------------------- Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={handleInvite}
      />
    </div>
  );
}

// ------------------------------------------------------------- InviteDialog
function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (values: InviteForm) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", role: "manager" },
  });

  React.useEffect(() => {
    if (open) reset({ name: "", email: "", role: "manager" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They&apos;ll be added as invited until they accept.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Field label="Name" htmlFor="inv-name" required error={errors.name?.message}>
            <Input id="inv-name" {...register("name")} placeholder="Jane Doe" />
          </Field>
          <Field
            label="Email"
            htmlFor="inv-email"
            required
            error={errors.email?.message}
          >
            <Input
              id="inv-email"
              type="email"
              {...register("email")}
              placeholder="jane@company.com"
            />
          </Field>
          <Field label="Role" htmlFor="inv-role" required>
            <NativeSelect id="inv-role" {...register("role")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------- OrganizationForm
interface OrgFormValues {
  name: string;
  legalName: string;
  industry: string;
  currency: string;
  gstin: string;
  phone: string;
  website: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

const orgSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  legalName: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  currency: z.string().min(1),
  gstin: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  addressLine1: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
});

function OrganizationForm({
  defaults,
  created,
  onSave,
}: {
  defaults: OrgFormValues;
  created: string;
  onSave: (patch: OrgFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: defaults,
  });

  return (
    <Card className="p-6">
      <form
        onSubmit={handleSubmit((values) => onSave(values))}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Organization name"
            htmlFor="o-name"
            required
            error={errors.name?.message}
          >
            <Input id="o-name" {...register("name")} />
          </Field>
          <Field label="Legal name" htmlFor="o-legal">
            <Input id="o-legal" {...register("legalName")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" htmlFor="o-industry">
            <NativeSelect id="o-industry" {...register("industry")}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Currency" htmlFor="o-currency" required>
            <NativeSelect id="o-currency" {...register("currency")}>
              {CURRENCIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="GSTIN / Tax ID" htmlFor="o-gstin">
            <Input id="o-gstin" {...register("gstin")} />
          </Field>
          <Field label="Phone" htmlFor="o-phone">
            <Input id="o-phone" {...register("phone")} />
          </Field>
          <Field label="Website" htmlFor="o-website">
            <Input id="o-website" {...register("website")} placeholder="https://" />
          </Field>
        </div>

        <Field label="Address" htmlFor="o-addr">
          <Input id="o-addr" {...register("addressLine1")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="City" htmlFor="o-city">
            <Input id="o-city" {...register("city")} />
          </Field>
          <Field label="State" htmlFor="o-state">
            <Input id="o-state" {...register("state")} />
          </Field>
          <Field label="Country" htmlFor="o-country">
            <Input id="o-country" {...register("country")} />
          </Field>
          <Field label="Postal code" htmlFor="o-postal">
            <Input id="o-postal" {...register("postalCode")} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Created {created ? formatDate(created) : "—"}
          </p>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

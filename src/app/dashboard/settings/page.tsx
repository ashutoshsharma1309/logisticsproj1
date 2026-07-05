"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Save,
  Mail,
  Truck,
  Timer,
  CalendarClock,
  ShieldAlert,
  Check,
  KeyRound,
  ShieldCheck,
  Laptop,
  LogOut,
  Building2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field, NativeSelect } from "@/components/form/field";
import { CURRENCIES, INDUSTRIES } from "@/config/options";
import { ROLE_LABELS } from "@/config/user";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadDemoButton, ResetWorkspaceButton } from "@/components/dashboard/demo-data";
import { useMounted } from "@/hooks/use-mounted";
import { readValue, writeValue } from "@/lib/db/client";
import { cn, initials } from "@/lib/utils";

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

// ---------------------------------------------------------- Notifications prefs
interface NotificationPrefs {
  emailUpdates: boolean;
  shipmentStatus: boolean;
  delayAlerts: boolean;
  weeklyDigest: boolean;
  ledgerAnomalies: boolean;
}

const NOTIFICATION_DEFAULTS: NotificationPrefs = {
  emailUpdates: true,
  shipmentStatus: true,
  delayAlerts: true,
  weeklyDigest: false,
  ledgerAnomalies: true,
};

const NOTIFICATION_ROWS: {
  key: keyof NotificationPrefs;
  label: string;
  desc: string;
  icon: typeof Mail;
}[] = [
  { key: "emailUpdates", label: "Email updates", desc: "Account and delivery updates by email", icon: Mail },
  { key: "shipmentStatus", label: "Shipment status changes", desc: "Ping me when a shipment changes state", icon: Truck },
  { key: "delayAlerts", label: "Delay alerts", desc: "Warn me about predicted disruptions", icon: Timer },
  { key: "weeklyDigest", label: "Weekly digest", desc: "Performance summary every Monday", icon: CalendarClock },
  { key: "ledgerAnomalies", label: "Ledger anomalies", desc: "Integrity and chain verification warnings", icon: ShieldAlert },
];

const NOTIFICATIONS_KEY = "prefs:notifications";
const SECURITY_KEY = "prefs:security";

interface SecurityPrefs {
  twoFactor: boolean;
}

const SECURITY_DEFAULTS: SecurityPrefs = { twoFactor: false };

// ------------------------------------------------------------------- Appearance
function ThemeTiles() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && theme === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            aria-pressed={active}
            aria-label={`${opt.label} theme`}
            className={cn(
              "relative flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-clay transition-all duration-300 hover:-translate-y-1 hover:shadow-clay-lg",
              active && "ring-2 ring-primary",
            )}
          >
            {active && (
              <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted/50 text-foreground shadow-clay-inset">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------- Profile
function ProfileTab() {
  const { account, updateProfile } = useAuth();
  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    setName(account?.name ?? "");
    setAvatar(account?.avatar ?? "");
  }, [account]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter your full name (at least 2 characters).");
      return;
    }
    setError(undefined);
    updateProfile({ name: trimmed, avatar: avatar.trim() });
    toast.success("Profile saved", {
      description: "Your changes are live across the workspace.",
    });
  }

  const displayName = name.trim() || account?.name || "";

  return (
    <FadeIn>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shadow-clay-sm">
                {avatar.trim() && (
                  <AvatarImage src={avatar.trim()} alt={displayName} />
                )}
                <AvatarFallback>{initials(displayName || "?")}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{displayName || "Your name"}</p>
                {account && (
                  <Badge variant="accent">{ROLE_LABELS[account.role]}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" required error={error}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field label="Email" htmlFor="email" hint="Read-only">
                <Input
                  id="email"
                  type="email"
                  value={account?.email ?? ""}
                  readOnly
                  disabled
                />
              </Field>
              <Field
                label="Avatar URL"
                htmlFor="avatar"
                hint="Optional"
                className="sm:col-span-2"
              >
                <Input
                  id="avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://…/photo.png"
                />
              </Field>
            </div>

            <Button type="submit">
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

// ----------------------------------------------------------------- Organization
interface OrgForm {
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

const EMPTY_ORG: OrgForm = {
  name: "",
  legalName: "",
  industry: "",
  currency: "USD",
  gstin: "",
  phone: "",
  website: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
};

function OrganizationTab() {
  const { org, updateOrganization } = useAuth();
  const [form, setForm] = React.useState<OrgForm>(EMPTY_ORG);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (!org) return;
    setForm({
      name: org.name ?? "",
      legalName: org.legalName ?? "",
      industry: org.industry ?? "",
      currency: org.currency || "USD",
      gstin: org.gstin ?? "",
      phone: org.phone ?? "",
      website: org.website ?? "",
      addressLine1: org.addressLine1 ?? "",
      city: org.city ?? "",
      state: org.state ?? "",
      country: org.country ?? "",
      postalCode: org.postalCode ?? "",
    });
  }, [org]);

  function set<K extends keyof OrgForm>(key: K, value: OrgForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Organization name is required.");
      return;
    }
    setError(undefined);
    updateOrganization({
      name: form.name.trim(),
      legalName: form.legalName.trim(),
      industry: form.industry,
      currency: form.currency,
      gstin: form.gstin.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      addressLine1: form.addressLine1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      postalCode: form.postalCode.trim(),
    });
    toast.success("Organization updated", {
      description: "Your business details have been saved.",
    });
  }

  return (
    <FadeIn>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Organization name" htmlFor="org-name" required error={error}>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="ChainRoute Logistics"
                />
              </Field>
              <Field label="Legal name" htmlFor="org-legal">
                <Input
                  id="org-legal"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                  placeholder="ChainRoute Logistics Pvt. Ltd."
                />
              </Field>
              <Field label="Industry" htmlFor="org-industry">
                <NativeSelect
                  id="org-industry"
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                >
                  <option value="">Select an industry…</option>
                  {INDUSTRIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Currency" htmlFor="org-currency">
                <NativeSelect
                  id="org-currency"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="GSTIN / Tax ID" htmlFor="org-gstin">
                <Input
                  id="org-gstin"
                  value={form.gstin}
                  onChange={(e) => set("gstin", e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </Field>
              <Field label="Phone" htmlFor="org-phone">
                <Input
                  id="org-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 555 000 1234"
                />
              </Field>
              <Field label="Website" htmlFor="org-website" className="sm:col-span-2">
                <Input
                  id="org-website"
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://chainroute.example"
                />
              </Field>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Address line 1" htmlFor="org-addr" className="sm:col-span-2">
                <Input
                  id="org-addr"
                  value={form.addressLine1}
                  onChange={(e) => set("addressLine1", e.target.value)}
                  placeholder="221B Harbour Road"
                />
              </Field>
              <Field label="City" htmlFor="org-city">
                <Input
                  id="org-city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Rotterdam"
                />
              </Field>
              <Field label="State / Province" htmlFor="org-state">
                <Input
                  id="org-state"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="South Holland"
                />
              </Field>
              <Field label="Country" htmlFor="org-country">
                <Input
                  id="org-country"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="Netherlands"
                />
              </Field>
              <Field label="Postal code" htmlFor="org-postal">
                <Input
                  id="org-postal"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  placeholder="3011 AA"
                />
              </Field>
            </div>

            <Button type="submit">
              <Save className="h-4 w-4" />
              Save organization
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

// ------------------------------------------------------------------ Notifications
function NotificationsTab() {
  const mounted = useMounted();
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(NOTIFICATION_DEFAULTS);

  React.useEffect(() => {
    const stored = readValue<NotificationPrefs>(NOTIFICATIONS_KEY);
    if (stored) setPrefs({ ...NOTIFICATION_DEFAULTS, ...stored });
  }, []);

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      writeValue(NOTIFICATIONS_KEY, next);
      return next;
    });
  }

  return (
    <FadeIn>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_ROWS.map((row, i) => {
            const Icon = row.icon;
            return (
              <React.Fragment key={row.key}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/50 text-muted-foreground shadow-clay-inset">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={prefs[row.key]}
                    disabled={!mounted}
                    aria-label={row.label}
                    onCheckedChange={(v) => toggle(row.key, v)}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </CardContent>
      </Card>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------- Security
function SecurityTab() {
  const router = useRouter();
  const mounted = useMounted();
  const { account, changePassword, signOut } = useAuth();

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});

  const [security, setSecurity] = React.useState<SecurityPrefs>(SECURITY_DEFAULTS);
  React.useEffect(() => {
    const stored = readValue<SecurityPrefs>(SECURITY_KEY);
    if (stored) setSecurity({ ...SECURITY_DEFAULTS, ...stored });
  }, []);

  function toggleTwoFactor(value: boolean) {
    const nextPrefs = { twoFactor: value };
    setSecurity(nextPrefs);
    writeValue(SECURITY_KEY, nextPrefs);
    toast.success(`Two-factor authentication ${value ? "enabled" : "disabled"}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!current) nextErrors.current = "Enter your current password.";
    if (next.length < 8) nextErrors.next = "New password must be at least 8 characters.";
    if (confirm !== next) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      changePassword(current, next);
      toast.success("Password updated", {
        description: "Use your new password next time you sign in.",
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update password.";
      setErrors({ current: message });
      toast.error(message);
    }
  }

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-5">
      <FadeIn>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field label="Current password" htmlFor="current" required error={errors.current}>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="New password"
                  htmlFor="new"
                  required
                  hint="Min 8 characters"
                  error={errors.next}
                >
                  <Input
                    id="new"
                    type="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                  />
                </Field>
                <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit">Update password</Button>
            </form>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="max-w-3xl">
          <CardContent className="flex items-center justify-between gap-3 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success shadow-clay-inset">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account.
                </p>
              </div>
            </div>
            <Switch
              checked={security.twoFactor}
              disabled={!mounted}
              aria-label="Two-factor authentication"
              onCheckedChange={toggleTwoFactor}
            />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 shadow-clay-inset">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-card text-muted-foreground shadow-clay-sm">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    This browser
                    <Badge variant="success">Current session</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account ? `Signed in as ${account.email}` : "Signed in"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

// ------------------------------------------------------------------------- Page
export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Settings"
          description="Manage your profile, organization, preferences, and security."
        />
      </FadeIn>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-5">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeTiles />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="data">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>Workspace data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-5 shadow-clay-inset sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Sample dataset</p>
                    <p className="text-xs text-muted-foreground">
                      Load an opt-in demo dataset (warehouses, fleet, customers, shipments and a
                      minted ledger) to explore the product with live data.
                    </p>
                  </div>
                  <LoadDemoButton variant="clay" className="shrink-0" />
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-destructive/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-destructive">Danger zone</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete every record in this workspace and start clean.
                    </p>
                  </div>
                  <ResetWorkspaceButton />
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}

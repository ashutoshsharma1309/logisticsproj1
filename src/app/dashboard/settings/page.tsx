"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Save,
  Bell,
  Mail,
  MessageSquareText,
  Smartphone,
  CalendarClock,
  ShieldAlert,
  Timer,
  Check,
  KeyRound,
  ShieldCheck,
  Laptop,
  LogOut,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/shared/motion";
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
import { getStore } from "@/services/store";
import { DEMO_USER, ROLE_LABELS } from "@/config/user";
import { useMounted } from "@/hooks/use-mounted";
import { cn, formatCurrency, formatDate, initials } from "@/lib/utils";
import type { UserRole } from "@/types";
import type { ComponentProps } from "react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const ROLES: UserRole[] = ["admin", "manager", "warehouse", "driver", "customer"];

const INVOICE_VARIANT: Record<string, BadgeVariant> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  draft: "muted",
};

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

interface Session {
  id: string;
  device: string;
  location: string;
  when: string;
  current: boolean;
}

const SESSIONS: Session[] = [
  {
    id: "ses_1",
    device: "MacBook Pro · Chrome",
    location: "Rotterdam, NL",
    when: "Active now",
    current: true,
  },
  {
    id: "ses_2",
    device: "iPhone 15 · Safari",
    location: "Amsterdam, NL",
    when: "3 hours ago",
    current: false,
  },
  {
    id: "ses_3",
    device: "Windows 11 · Edge",
    location: "Berlin, DE",
    when: "Yesterday",
    current: false,
  },
];

const NOTIFICATIONS = [
  { key: "email", label: "Email", desc: "Account and delivery updates", icon: Mail, def: true },
  { key: "push", label: "Push", desc: "Real-time milestone pings", icon: Bell, def: true },
  { key: "sms", label: "SMS", desc: "Critical delays only", icon: MessageSquareText, def: false },
  { key: "digest", label: "Weekly digest", desc: "Performance summary every Monday", icon: CalendarClock, def: true },
  { key: "anomaly", label: "Anomaly alerts", desc: "Ledger and integrity warnings", icon: ShieldAlert, def: true },
  { key: "delay", label: "Delay predictions", desc: "AI-forecasted disruption alerts", icon: Timer, def: false },
] as const;

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

export default function SettingsPage() {
  const { invoices } = getStore();
  const billingInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          title="Settings"
          description="Manage your profile, preferences, security, and billing."
        />
      </FadeIn>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------- Profile */}
        <TabsContent value="profile">
          <FadeIn>
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Profile saved", {
                      description: "Your changes are live across the workspace.",
                    });
                  }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 shadow-clay-sm">
                      <AvatarImage src={DEMO_USER.avatar} alt={DEMO_USER.name} />
                      <AvatarFallback>{initials(DEMO_USER.name)}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Choose a new avatar")}
                    >
                      Change photo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" defaultValue={DEMO_USER.name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={DEMO_USER.email}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" defaultValue={DEMO_USER.company} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="role">Role</Label>
                      <Select defaultValue={DEMO_USER.role}>
                        <SelectTrigger id="role">
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
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      defaultValue="Head of logistics operations at ChainRoute AI. Building the decentralized backbone for global freight."
                    />
                  </div>

                  <Button type="submit">
                    <Save className="h-4 w-4" />
                    Save changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* -------------------------------------------------- Appearance */}
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

          <FadeIn delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle>Interface preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Compact density",
                    desc: "Tighten spacing across tables and lists",
                    def: false,
                  },
                  {
                    label: "Vivid accents",
                    desc: "Use gradient highlights on interactive surfaces",
                    def: true,
                  },
                  {
                    label: "Reduce motion",
                    desc: "Minimize animations and transitions",
                    def: false,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                    <Switch
                      defaultChecked={row.def}
                      aria-label={row.label}
                      onCheckedChange={(v) =>
                        toast.success(`${row.label} ${v ? "on" : "off"}`)
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* ----------------------------------------------- Notifications */}
        <TabsContent value="notifications">
          <FadeIn>
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Notification channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {NOTIFICATIONS.map((row, i) => {
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
                            <p className="text-xs text-muted-foreground">
                              {row.desc}
                            </p>
                          </div>
                        </div>
                        <Switch
                          defaultChecked={row.def}
                          aria-label={row.label}
                          onCheckedChange={(v) =>
                            toast.success(
                              `${row.label} notifications ${v ? "enabled" : "disabled"}`,
                            )
                          }
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* ---------------------------------------------------- Security */}
        <TabsContent value="security" className="space-y-5">
          <FadeIn>
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Change password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Password updated", {
                      description: "Use your new password next time you sign in.",
                    });
                    (e.target as HTMLFormElement).reset();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new">New password</Label>
                      <Input id="new" type="password" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input id="confirm" type="password" required />
                    </div>
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
                    <p className="text-sm font-semibold">
                      Two-factor authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                </div>
                <Switch
                  defaultChecked
                  aria-label="Two-factor authentication"
                  onCheckedChange={(v) =>
                    toast.success(`Two-factor ${v ? "enabled" : "disabled"}`)
                  }
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
                {SESSIONS.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 shadow-clay-inset"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-card text-muted-foreground shadow-clay-sm">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {s.device}
                          {s.current && (
                            <Badge variant="success">This device</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.location} · {s.when}
                        </p>
                      </div>
                    </div>
                    {!s.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast.success(`Session revoked`, {
                            description: `${s.device} was signed out.`,
                          })
                        }
                      >
                        <LogOut className="h-4 w-4" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* ----------------------------------------------------- Billing */}
        <TabsContent value="billing" className="space-y-5">
          <FadeIn>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/12 via-accent/8 to-secondary/12 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Current plan
                      </p>
                      <Badge variant="accent">Business</Badge>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight">
                      {formatCurrency(499)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / month
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Billed monthly · renews Aug 1, 2026
                    </p>
                  </div>
                  <Button variant="gradient" asChild>
                    <Link href="/pricing">
                      <Sparkles className="h-4 w-4" />
                      Upgrade plan
                    </Link>
                  </Button>
                </div>
              </div>
              <CardContent className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipments used</span>
                    <span className="font-semibold">3,240 / 5,000</span>
                  </div>
                  <Progress value={64.8} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API calls</span>
                    <span className="font-semibold">812K / 1M</span>
                  </div>
                  <Progress value={81.2} indicatorClassName="from-warning to-accent" />
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment method
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-14 place-items-center rounded-lg bg-muted/50 text-xs font-bold shadow-clay-inset">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 09 / 27</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Update payment method")}
                >
                  Update
                </Button>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Invoice history</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6">Issued</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-medium">
                          {inv.number}
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
                        <TableCell className="pr-6 text-muted-foreground">
                          {formatDate(inv.issued)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}

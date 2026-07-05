"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  MapPin,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/form/field";
import { useAuth } from "@/components/providers/auth-provider";
import { pushNotification } from "@/lib/db/audit";
import { CURRENCIES, INDUSTRIES } from "@/config/options";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "company", title: "Company profile", icon: Building2 },
  { id: "address", title: "Business address", icon: MapPin },
  { id: "finish", title: "You're all set", icon: Rocket },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { status, account, org, updateOrganization, orgId } = useAuth();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    legalName: "",
    industry: "manufacturing",
    currency: "USD",
    gstin: "",
    phone: "",
    website: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  React.useEffect(() => {
    if (status === "guest") router.replace("/login");
    if (status === "authed" && org?.onboarded) router.replace("/dashboard");
  }, [status, org, router]);

  React.useEffect(() => {
    if (org) {
      setForm((f) => ({
        ...f,
        name: org.name || f.name,
        currency: org.currency || f.currency,
      }));
    }
  }, [org]);

  if (status !== "authed") {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext = step === 0 ? form.name.trim().length > 1 : true;

  const finish = () => {
    setSaving(true);
    updateOrganization({ ...form, onboarded: true });
    if (orgId) {
      pushNotification({
        orgId,
        title: "Welcome to ChainRoute AI",
        body: "Your workspace is ready. Add your first warehouse or shipment to begin.",
        kind: "success",
        href: "/dashboard",
      });
    }
    toast.success("Workspace ready!");
    setTimeout(() => router.push("/dashboard"), 400);
  };

  const StepIcon = STEPS[step]!.icon;

  return (
    <div className="relative min-h-screen bg-mesh">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo href="" size="lg" />
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold transition-colors",
                    i < step
                      ? "bg-success text-success-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground shadow-clay-sm"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 w-8 rounded-full", i < step ? "bg-success" : "bg-muted")} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="clay-lg p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="text-xl font-bold">{STEPS[step]!.title}</h1>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company name" required htmlFor="name" className="sm:col-span-2">
                    <Input id="name" value={form.name} onChange={set("name")} placeholder="Acme Logistics Pvt Ltd" />
                  </Field>
                  <Field label="Legal / registered name" htmlFor="legalName" className="sm:col-span-2">
                    <Input id="legalName" value={form.legalName} onChange={set("legalName")} placeholder="Optional" />
                  </Field>
                  <Field label="Industry" htmlFor="industry">
                    <NativeSelect id="industry" value={form.industry} onChange={set("industry")}>
                      {INDUSTRIES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Reporting currency" htmlFor="currency">
                    <NativeSelect id="currency" value={form.currency} onChange={set("currency")}>
                      {CURRENCIES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Tax ID / GSTIN" htmlFor="gstin">
                    <Input id="gstin" value={form.gstin} onChange={set("gstin")} placeholder="Optional" />
                  </Field>
                  <Field label="Website" htmlFor="website">
                    <Input id="website" value={form.website} onChange={set("website")} placeholder="https://" />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Address" htmlFor="addr" className="sm:col-span-2">
                    <Input id="addr" value={form.addressLine1} onChange={set("addressLine1")} placeholder="Street address" />
                  </Field>
                  <Field label="City" htmlFor="city">
                    <Input id="city" value={form.city} onChange={set("city")} />
                  </Field>
                  <Field label="State / Region" htmlFor="state">
                    <Input id="state" value={form.state} onChange={set("state")} />
                  </Field>
                  <Field label="Country" htmlFor="country">
                    <Input id="country" value={form.country} onChange={set("country")} />
                  </Field>
                  <Field label="Postal code" htmlFor="postal">
                    <Input id="postal" value={form.postalCode} onChange={set("postalCode")} />
                  </Field>
                  <Field label="Phone" htmlFor="phone" className="sm:col-span-2">
                    <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="Optional" />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 py-2 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-clay">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{form.name || "Your workspace"} is ready</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Signed in as <span className="font-medium text-foreground">{account?.email}</span>.
                      You start with a clean workspace — no sample data. Add your warehouses, fleet,
                      customers and shipments, and analytics build themselves.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="gradient" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gradient" onClick={finish} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Enter dashboard
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can change any of this later in Settings → Organization.
        </p>
      </div>
    </div>
  );
}

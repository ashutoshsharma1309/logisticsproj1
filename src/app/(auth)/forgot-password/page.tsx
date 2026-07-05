"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { motion } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/field";
import { useAuth } from "@/components/providers/auth-provider";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestReset, resetPassword } = useAuth();
  const [stage, setStage] = React.useState<"email" | "reset">("email");
  const [email, setEmail] = React.useState("");
  const [demoCode, setDemoCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", password: "", confirm: "" });
  const [error, setError] = React.useState<string | null>(null);

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const code = requestReset(email);
      setDemoCode(code);
      setStage("reset");
      toast.success("Recovery code generated", {
        description: "Email delivery is simulated — your code is shown on screen.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setBusy(false);
    }
  };

  const doReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      resetPassword(email, form.code, form.password);
      toast.success("Password updated", { description: "You can now sign in." });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={stage === "email" ? "Reset your password" : "Enter your new password"}
      subtitle={
        stage === "email"
          ? "Enter your account email and we'll generate a recovery code."
          : undefined
      }
    >
      {stage === "email" ? (
        <div className="space-y-6">
          <form onSubmit={sendCode} className="space-y-4" noValidate>
            <Field label="Work email" htmlFor="email" required error={error ?? undefined}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Send recovery code
            </Button>
          </form>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4 shadow-clay-inset">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary via-accent to-secondary text-white">
              <MailCheck className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="text-muted-foreground">Recovery code for {email}:</p>
              <p className="font-mono text-lg font-bold tracking-widest text-foreground">{demoCode}</p>
            </div>
          </div>

          <form onSubmit={doReset} className="space-y-4" noValidate>
            <Field label="Recovery code" htmlFor="code" required>
              <Input
                id="code"
                inputMode="numeric"
                placeholder="6-digit code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </Field>
            <Field label="New password" htmlFor="pw" required>
              <Input
                id="pw"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </Field>
            <Field label="Confirm new password" htmlFor="cpw" required error={error ?? undefined}>
              <Input
                id="cpw"
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </Field>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </Button>
          </form>
          <Button variant="ghost" className="w-full" onClick={() => setStage("email")}>
            Use a different email
          </Button>
        </motion.div>
      )}
    </AuthShell>
  );
}

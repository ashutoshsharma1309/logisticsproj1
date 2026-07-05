"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { motion } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotSchema, type ForgotValues } from "@/lib/validators";
import { sleep } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    await sleep(900);
    toast.success("Reset link sent", {
      description: `We emailed a 6-digit code to ${values.email}.`,
    });
    setSentTo(values.email);
  }

  return (
    <AuthShell
      title={sentTo ? "Check your inbox" : "Reset your password"}
      subtitle={
        sentTo
          ? undefined
          : "Enter your account email and we'll send you a recovery code."
      }
    >
      {sentTo ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 p-6 text-center shadow-clay-inset">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-clay-sm">
              <MailCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                We sent a recovery code to
              </p>
              <p className="mt-0.5 font-semibold text-foreground">{sentTo}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              The code expires in 10 minutes. Didn&apos;t get it? Check spam or resend
              from the next screen.
            </p>
          </div>

          <Button asChild variant="gradient" size="lg" className="w-full">
            <Link href="/verify-otp">
              Enter code
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setSentTo(null)}
          >
            Use a different email
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending code…
                </>
              ) : (
                <>
                  Send recovery code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

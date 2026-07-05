"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { otpSchema } from "@/lib/validators";
import { cn, sleep } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [digits, setDigits] = React.useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_SECONDS);
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdown]);

  React.useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join("");

  function focusInput(index: number) {
    const target = inputsRef.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  }

  function setDigitAt(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigitAt(index, "");
      return;
    }
    // Only keep the last typed character for a single box
    const char = value[value.length - 1];
    setDigitAt(index, char);
    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        event.preventDefault();
        setDigitAt(index - 1, "");
        focusInput(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError(null);
    const focusTarget = Math.min(pasted.length, OTP_LENGTH - 1);
    focusInput(focusTarget);
  }

  async function verify(fullCode: string) {
    const result = otpSchema.safeParse({ code: fullCode });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    setSubmitting(true);
    await sleep(900);
    toast.success("Identity verified", {
      description: "Your account is confirmed — welcome aboard.",
    });
    router.push("/dashboard");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void verify(code);
  }

  function handleResend() {
    if (countdown > 0) return;
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    setCountdown(RESEND_SECONDS);
    focusInput(0);
    toast.info("A fresh code is on its way", {
      description: "Enter the new 6-digit code we just sent.",
    });
  }

  return (
    <AuthShell
      title="Verify your identity"
      subtitle="Enter the 6-digit code we sent to your email."
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div
          className="flex justify-between gap-2 sm:gap-3"
          role="group"
          aria-label="One-time passcode"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1}`}
              aria-invalid={!!error}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={cn(
                "h-14 w-full rounded-2xl bg-muted/50 text-center text-xl font-bold text-foreground shadow-clay-inset transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                digit && "bg-card shadow-clay-sm ring-2 ring-primary/40",
                error && "ring-2 ring-destructive/60",
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs font-medium text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={submitting || code.length < OTP_LENGTH}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Verify &amp; continue
            </>
          )}
        </Button>

        <div className="flex flex-col items-center gap-3 text-sm">
          {countdown > 0 ? (
            <p className="text-muted-foreground">
              Resend code in{" "}
              <span className="font-semibold text-foreground">
                0:{countdown.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Resend code
            </button>
          )}

          <Link
            href="/login"
            className="flex items-center gap-1.5 font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialButtons } from "@/components/auth/social-buttons";
import { RoleSelect } from "@/components/auth/role-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { signupSchema, type SignupValues } from "@/lib/validators";
import { cn, sleep } from "@/lib/utils";

interface Strength {
  score: number; // 0-4
  label: string;
  color: string;
}

function scorePassword(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = [
    "bg-destructive",
    "bg-destructive",
    "bg-warning",
    "bg-success",
    "bg-success",
  ];
  return { score, label: labels[score], color: colors[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "manager",
      acceptTerms: true,
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const strength = React.useMemo(() => scorePassword(passwordValue), [passwordValue]);

  async function onSubmit(values: SignupValues) {
    await sleep(1000);
    toast.success(`Account created for ${values.name}`, {
      description: "Spinning up your ChainRoute workspace.",
    });
    router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Launch a simulated logistics network in under a minute."
    >
      <div className="space-y-6">
        <SocialButtons />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Rivera"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

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
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordValue.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1.5" aria-hidden>
                  {[0, 1, 2, 3].map((bar) => (
                    <span
                      key={bar}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        bar < strength.score ? strength.color : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Password strength: <span className="text-foreground">{strength.label}</span>
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Your role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleSelect value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.role && (
              <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3.5 shadow-clay-inset">
            <Controller
              control={control}
              name="acceptTerms"
              render={({ field }) => (
                <Switch
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              )}
            />
            <Label htmlFor="acceptTerms" className="cursor-pointer font-normal leading-snug text-muted-foreground">
              I agree to the{" "}
              <span className="font-semibold text-primary">Terms of Service</span> and{" "}
              <span className="font-semibold text-primary">Privacy Policy</span>.
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs font-medium text-destructive">{errors.acceptTerms.message}</p>
          )}

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
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

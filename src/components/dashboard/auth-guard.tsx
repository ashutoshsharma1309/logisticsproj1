"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/brand/logo";

/**
 * Client-side route guard for the dashboard. Redirects unauthenticated users to
 * sign-in and users whose organization hasn't finished onboarding to the wizard.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, org } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    } else if (status === "authed" && org && !org.onboarded) {
      router.replace("/onboarding");
    }
  }, [status, org, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo href="" size="lg" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your workspace…
          </div>
        </div>
      </div>
    );
  }

  if (status === "guest" || (org && !org.onboarded)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

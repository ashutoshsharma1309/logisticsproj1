"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface the error to the console for debugging/observability.
    console.error(error);
  }, [error]);

  return (
    <div className="bg-mesh relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-destructive/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-64 w-64 rounded-full bg-warning/15 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Logo href="/" size="lg" />
        </div>

        <Card className="p-10 text-center sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/12 text-destructive shadow-clay-inset">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-muted-foreground">
            An unexpected error interrupted this view. Our team has been notified — you can retry the
            action or head back to safe ground.
          </p>

          {error.digest && (
            <p className="mx-auto mt-4 w-fit rounded-lg bg-muted/60 px-3 py-1.5 font-mono text-xs text-muted-foreground shadow-clay-inset">
              Ref: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="gradient" size="lg" onClick={() => reset()}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="clay" size="lg">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

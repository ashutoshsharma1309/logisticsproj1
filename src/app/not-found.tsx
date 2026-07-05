import Link from "next/link";
import { Home, LayoutDashboard, Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-mesh relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Logo href="/" size="lg" />
        </div>

        <Card className="p-10 text-center sm:p-12">
          <p
            aria-hidden
            className="text-gradient text-7xl font-black tracking-tight sm:text-8xl"
          >
            404
          </p>
          <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary shadow-clay-inset">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">This route went off-grid</h1>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-muted-foreground">
            The page you're looking for isn't on the manifest. It may have been moved, delivered, or
            never existed. Let's reroute you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="gradient" size="lg">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back home
              </Link>
            </Button>
            <Button asChild variant="clay" size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Go to dashboard
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

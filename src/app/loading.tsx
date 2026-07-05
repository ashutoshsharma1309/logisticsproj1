import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-mesh relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="animate-pulse-ring rounded-2xl">
          <div className="animate-float">
            <Logo href="" size="lg" showText={false} />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Loading your control tower…</p>
        </div>

        {/* Skeleton preview of the incoming layout */}
        <div className="mt-12 w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

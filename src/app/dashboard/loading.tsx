import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-8 w-28" />
            <Skeleton className="mt-2.5 h-4 w-20" />
            <Skeleton className="mt-4 h-8 w-full" />
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="mt-6 h-64 w-full" />
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="mt-6 flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>

      {/* Table / list block */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

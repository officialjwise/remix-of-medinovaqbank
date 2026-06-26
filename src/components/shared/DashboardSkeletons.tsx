import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

function SkelCard({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Title + subtitle placeholder lines used in every panel header. */
function SkelHeading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-44" />
    </div>
  );
}

/** A surface KPI card placeholder mirroring <GradientKpiCard>. */
function KpiSkeleton() {
  return (
    <SkelCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-28 rounded-full" />
    </SkelCard>
  );
}

/** Panel with a header and a single chart-shaped block. */
function ChartPanelSkeleton({ h, pad = "p-5" }: { h: string; pad?: string }) {
  return (
    <SkelCard className={pad}>
      <SkelHeading />
      <Skeleton className={`mt-4 w-full rounded-xl ${h}`} />
    </SkelCard>
  );
}

/** Panel with a header and a list of avatar/two-line/trailing rows. */
function ListPanelSkeleton({ rows, pad = "p-5" }: { rows: number; pad?: string }) {
  return (
    <SkelCard className={pad}>
      <div className="flex items-start justify-between">
        <SkelHeading />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-14 flex-shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </SkelCard>
  );
}

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <ChartPanelSkeleton h="h-64" />
          <ChartPanelSkeleton h="h-56" />
          <ChartPanelSkeleton h="h-52" />
          <ListPanelSkeleton rows={3} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ChartPanelSkeleton h="h-48" />
          <SkelCard className="p-5">
            <SkelHeading />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </SkelCard>
          <ListPanelSkeleton rows={3} />
          <ListPanelSkeleton rows={4} />
          <SkelCard className="p-5">
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </SkelCard>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User dashboard                                                      */
/* ------------------------------------------------------------------ */

export function UserDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Greeting banner */}
      <SkelCard className="p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 flex-shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </SkelCard>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Start / continue card */}
      <SkelCard className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 flex-shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </SkelCard>

      {/* Two-column main layout */}
      <div className="grid gap-8 xl:grid-cols-5">
        {/* Left (3/5) */}
        <div className="space-y-8 xl:col-span-3">
          {/* Weekly activity */}
          <SkelCard className="p-6">
            <SkelHeading />
            <div className="mt-5 flex items-end justify-between gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-2.5 w-3" />
                </div>
              ))}
            </div>
          </SkelCard>

          {/* Performance chart */}
          <ChartPanelSkeleton h="h-[200px]" pad="p-6" />

          {/* Recent sessions */}
          <ListPanelSkeleton rows={4} pad="p-6" />

          {/* Recommended banks */}
          <div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkelCard key={i} className="overflow-hidden p-0">
                  <Skeleton className="h-24 w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="mt-2 h-9 w-full rounded-xl" />
                  </div>
                </SkelCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right (2/5) */}
        <div className="space-y-8 xl:col-span-2">
          {/* Subject donut */}
          <SkelCard className="p-6">
            <SkelHeading />
            <div className="mt-2 flex justify-center">
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </SkelCard>

          {/* Topic mastery */}
          <SkelCard className="p-6">
            <SkelHeading />
            <div className="mt-4 space-y-3.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </SkelCard>

          {/* Leaderboard */}
          <ListPanelSkeleton rows={5} pad="p-6" />

          {/* Achievements */}
          <SkelCard className="p-6">
            <SkelHeading />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </SkelCard>
        </div>
      </div>
    </div>
  );
}

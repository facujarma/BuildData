function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Skeleton className="h-7 w-36 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Requires attention */}
      <div className="mb-5">
        <Skeleton className="h-3 w-40 rounded mb-2" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white border-slate-200">
              <div className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-lg flex-none" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-44 rounded" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <Skeleton className="h-3 w-28 rounded mb-2" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-lg shadow-card p-4"
          >
            <Skeleton className="w-9 h-9 rounded-lg mb-3" />
            <Skeleton className="h-8 w-20 rounded-md mb-1" />
            <Skeleton className="h-3 w-16 rounded mt-1" />
            <Skeleton className="h-4 w-24 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Progress by trade + Critical alerts */}
      <div className="grid grid-cols-[2fr_1fr] gap-3 mb-4">
        {/* Progress by trade */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-card p-0">
          <div className="px-5 py-3 border-b border-slate-200 space-y-1">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[160px_1fr_44px] gap-3 items-center"
              >
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-2 rounded-full" />
                <Skeleton className="h-4 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Critical alerts */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-card p-0">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="divide-y divide-slate-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-md flex-none" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-3">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Budget + Activity feed */}
      <div className="grid grid-cols-2 gap-3">
        {/* Budget */}
        <div className="blueprint-bg rounded-lg p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 rounded-full w-full mb-2" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="border-t border-white/10 pt-3 space-y-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto] items-center"
              >
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-card p-0">
          <div className="px-5 py-3 border-b border-slate-200">
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <div className="divide-y divide-slate-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-none" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-56 rounded" />
                </div>
                <Skeleton className="h-3 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

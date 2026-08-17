import { Skeleton } from "@heroui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-10">
      {/* Title + subtitle */}
      <Skeleton className="w-80 h-9 mb-2 rounded-sm" />
      <Skeleton className="h-5 mb-8 rounded-sm w-96" />

      {/* Tabs */}
      <div className="flex gap-6 pb-3 mb-6 border-b border-off-white/10">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={`tab-${i}`} className="w-28 h-6 rounded-sm" />
        ))}
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 max-w-md mb-6 rounded-sm" />

      {/* Table */}
      <div className="p-4 border rounded-sm bg-off-gray border-off-white/10">
        <div className="flex gap-4 mb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={`header-${i}`} className="flex-1 h-5 rounded-sm" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={`row-${i}`}
            className="flex gap-4 py-3 border-t border-off-white/5"
          >
            {[...Array(6)].map((_, j) => (
              <Skeleton
                key={`cell-${i}-${j}`}
                className="flex-1 h-5 rounded-sm"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

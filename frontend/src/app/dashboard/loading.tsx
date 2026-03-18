import { Skeleton } from "@heroui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      {/* Header */}
      <Skeleton className="h-10 w-64 rounded-lg mb-8" />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-24 w-full rounded-lg" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={`tab-${i}`} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex gap-4 mb-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-6 flex-1 rounded" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={`row-${i}`} className="flex gap-4 py-3 border-t border-gray-700">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={`cell-${i}-${j}`} className="h-5 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@heroui/skeleton";

export default function SearchLoading() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-12 py-8 flex flex-col lg:flex-row gap-8">
      {/* Filters sidebar skeleton */}
      <aside className="w-full lg:w-1/4 flex flex-col gap-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={`filter-${i}`} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </aside>

      {/* Main content skeleton */}
      <section className="w-full lg:w-3/4 flex flex-col gap-4">
        {/* Search bar */}
        <Skeleton className="h-12 w-full rounded-lg" />

        {/* Sort bar */}
        <div className="flex justify-end items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={`result-${i}`} className="flex flex-col gap-2">
              <Skeleton className="w-full h-[260px] rounded-lg" />
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

import { Skeleton } from "@heroui/skeleton";

export default function ModificationsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      {/* Modification items */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={`mod-${i}`} className="border border-gray-700 rounded-lg">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 gap-2">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

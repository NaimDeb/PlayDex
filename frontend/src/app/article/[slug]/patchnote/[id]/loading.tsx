import { Skeleton } from "@heroui/skeleton";

export default function PatchnoteDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 w-32 rounded" />
      </div>

      {/* Title */}
      <Skeleton className="h-9 w-80 rounded-lg mb-2" />

      {/* Game link */}
      <div className="flex items-center mb-6 gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-10 w-48 rounded" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 mb-8">
        <Skeleton className="h-10 w-44 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Content card */}
      <div className="border border-gray-700 rounded-lg p-6">
        <Skeleton className="h-7 w-2/3 rounded-lg mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}

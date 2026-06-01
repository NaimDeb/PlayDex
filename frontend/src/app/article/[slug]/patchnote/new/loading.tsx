import { Skeleton } from "@heroui/skeleton";

export default function NewPatchnoteLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <Skeleton className="h-9 w-96 rounded-lg mb-2" />

      {/* Warning banner */}
      <Skeleton className="h-20 w-full rounded-md my-6" />

      {/* Form fields */}
      <div className="space-y-6">
        {/* Title field */}
        <div>
          <Skeleton className="h-6 w-16 rounded mb-2" />
          <Skeleton className="h-12 w-1/3 rounded-lg" />
        </div>

        {/* Date field */}
        <div>
          <Skeleton className="h-6 w-16 rounded mb-2" />
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>

        {/* Summary field */}
        <div>
          <Skeleton className="h-6 w-20 rounded mb-2" />
          <Skeleton className="h-20 w-1/2 rounded-lg" />
        </div>

        {/* Importance field */}
        <div>
          <Skeleton className="h-6 w-28 rounded mb-2" />
          <Skeleton className="h-12 w-1/3 rounded-lg" />
        </div>

        {/* Content editor */}
        <div>
          <Skeleton className="h-6 w-24 rounded mb-2" />
          <Skeleton className="h-8 w-full rounded-t-lg" />
          <Skeleton className="h-64 w-full rounded-b-lg" />
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-6">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

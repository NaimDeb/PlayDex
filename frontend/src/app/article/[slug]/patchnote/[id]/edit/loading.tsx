import { Skeleton } from "@heroui/skeleton";

export default function EditPatchnoteLoading() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-12 py-8">
      {/* Page title */}
      <Skeleton className="h-8 w-96 rounded-lg mb-6" />

      {/* Warning banner */}
      <Skeleton className="h-16 w-full rounded-md mb-8" />

      {/* Form */}
      <div className="space-y-6">
        {/* Row: Title + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-4 w-12 rounded mb-1.5" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 rounded mb-1.5" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Row: Summary + Importance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-4 w-16 rounded mb-1.5" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 rounded mb-1.5" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Content editor */}
        <div>
          <Skeleton className="h-4 w-20 rounded mb-1.5" />
          <Skeleton className="h-10 w-full rounded-t-lg" />
          <Skeleton className="h-72 w-full rounded-b-lg" />
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </section>
  );
}

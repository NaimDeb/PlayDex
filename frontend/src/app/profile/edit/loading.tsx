import { Skeleton } from "@heroui/skeleton";

export default function ProfileEditLoading() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-9 w-56 rounded-lg" />
        </div>

        {/* Form card */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl bg-opacity-70 space-y-6">
          {/* Username field */}
          <div>
            <Skeleton className="h-4 w-40 rounded mb-2" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>

          {/* Email field */}
          <div>
            <Skeleton className="h-4 w-32 rounded mb-2" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>

          {/* Password section separator */}
          <div className="pt-6 border-t border-gray-600 space-y-4">
            <Skeleton className="h-6 w-52 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded" />

            <div>
              <Skeleton className="h-4 w-44 rounded mb-2" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="h-4 w-44 rounded mb-2" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="h-4 w-60 rounded mb-2" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <Skeleton className="h-12 w-28 rounded-md" />
            <Skeleton className="h-12 w-56 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

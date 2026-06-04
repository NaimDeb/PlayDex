import { Skeleton } from "@heroui/skeleton";

export default function PublicProfileLoading() {
  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Profile header */}
      <section className="mb-12">
        <div className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-lg shadow-xl md:flex-row md:items-start md:gap-8 bg-opacity-70">
          <Skeleton className="w-36 h-36 md:w-48 md:h-48 rounded-full flex-shrink-0" />
          <div className="flex-grow flex flex-col gap-2 w-full">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-6 w-24 rounded mt-1" />
          </div>
        </div>
      </section>

      {/* Game list section */}
      <section>
        <Skeleton className="h-9 w-32 rounded-lg mb-8" />
      </section>
    </div>
  );
}

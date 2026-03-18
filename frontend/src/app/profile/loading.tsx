import { Skeleton } from "@heroui/skeleton";

export default function ProfileLoading() {
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
            <Skeleton className="h-6 w-24 rounded mt-1" />
          </div>
          <div className="flex flex-col gap-3 md:self-start">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </section>

      {/* Game list section */}
      <section>
        <div className="flex flex-col items-center justify-between mb-8 sm:flex-row">
          <Skeleton className="h-9 w-32 rounded-lg mb-4 sm:mb-0" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={`game-${i}`} className="w-full h-[300px] rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}

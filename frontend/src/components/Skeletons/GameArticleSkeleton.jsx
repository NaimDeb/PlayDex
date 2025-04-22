import { Skeleton } from "@heroui/skeleton";

export function GameArticleSkeleton() {
  return (
    <div className="bg-off-black text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-40 mb-6" />
        <section className="flex flex-col md:flex-row gap-8 mb-12 mt-4">
          <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <Skeleton className="w-full h-[450px] rounded-lg" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-12 w-2/3 mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </section>
        <section className="mb-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-40 h-56 rounded-lg" />
            ))}
          </div>
        </section>
        <section>
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="flex gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-24" />
            ))}
          </div>
          <div className="relative pl-8 mt-16">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="mb-10 relative">
                <Skeleton className="absolute left-[-22px] top-1 w-6 h-6 rounded-full" />
                <Skeleton className="h-16 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
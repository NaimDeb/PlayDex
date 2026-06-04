import { Skeleton } from "@heroui/skeleton";

export default function HomeLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <header className="w-full bg-off-black mb-12" style={{ height: "40vh", minHeight: "280px" }}>
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 h-full flex items-center justify-between max-md:justify-center gap-8">
          <Skeleton className="max-md:hidden w-60 h-60 rounded-full flex-shrink-0" />
          <div className="flex flex-col items-center gap-4 text-center">
            <Skeleton className="h-10 w-80 rounded-lg" />
            <Skeleton className="h-6 w-64 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </header>

      {/* "Ma liste" section skeleton */}
      <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-12">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <div className="flex gap-4 pb-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={`list-${i}`} className="flex-shrink-0 w-[200px] h-[300px] rounded-lg" />
          ))}
        </div>
      </section>

      {/* "Derniers jeux ajoutés" section skeleton */}
      <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 mb-12">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-lg" />
        </div>
        <div className="flex gap-4 pb-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={`new-${i}`} className="flex-shrink-0 w-[200px] h-[300px] rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}

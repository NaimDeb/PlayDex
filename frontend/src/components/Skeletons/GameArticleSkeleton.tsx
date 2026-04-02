function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded bg-gray-700/60 animate-pulse ${className}`}
    />
  );
}

export function GameArticleSkeleton() {
  return (
    <div className="min-h-screen text-white bg-off-black">
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
        {/* Breadcrumb */}
        <Bone className="h-5 w-36 mb-6" />

        {/* Game info section */}
        <section className="flex flex-col md:flex-row gap-8 mb-12 mt-4">
          {/* Cover image */}
          <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <Bone className="w-full h-[400px] md:h-[450px] rounded-lg" />
          </div>

          {/* Game details */}
          <div className="flex-grow space-y-4">
            <div className="flex justify-between items-start">
              <Bone className="h-10 w-2/3" />
              <Bone className="h-10 w-28 rounded-lg" />
            </div>
            <Bone className="h-5 w-1/2" />
            <Bone className="h-4 w-1/4" />
            <div className="flex gap-2 mt-2">
              <Bone className="h-7 w-20 rounded-full" />
              <Bone className="h-7 w-24 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
            </div>
            <Bone className="h-24 w-full mt-4 rounded-lg" />
          </div>
        </section>

        {/* Extensions section */}
        <section className="mb-12">
          <Bone className="h-8 w-40 mb-4" />
          <div className="flex space-x-4 overflow-hidden pb-4">
            {[...Array(4)].map((_, i) => (
              <Bone key={i} className="w-36 h-52 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </section>

        {/* Updates timeline */}
        <section>
          <Bone className="h-8 w-56 mb-6" />
          <div className="flex gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <Bone key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
          <div className="relative pl-8 border-l-2 border-gray-700/40 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-8 relative">
                <Bone className="absolute -left-[21px] top-1 w-4 h-4 rounded-full" />
                <Bone className="h-20 w-full max-w-2xl rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

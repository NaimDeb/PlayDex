import React, { useState } from "react";
import { Patchnote } from "@/types/patchNoteType";
import { Extension } from "@/types/gameType";
import { PatchnoteCard } from "@/components/ArticleCard/PatchnoteCard";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface UpdatesTimelineSectionProps {
  patchnotes?: Patchnote[];
  extensions?: Extension[];
  formatDateDifference: (date: Date | string) => string;
}

const PATCHNOTE_TYPES = [
  { label: "Patchnote majeure", value: "major" },
  { label: "Patchnote mineure", value: "minor" },
  { label: "Hotfix", value: "hotfix" },
  { label: "Nouvelle extension", value: "extension" },
];

export const UpdatesTimelineSection: React.FC<UpdatesTimelineSectionProps> = ({
  patchnotes = [],
  extensions = [],
  formatDateDifference,
}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [checkedTypes, setCheckedTypes] = useState<string[]>(
    PATCHNOTE_TYPES.map((t) => t.value)
  );
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  const handleAddPatchnote = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    router.push(`${currentPath}/patchnote/new`);
  };

  // Combine and tag items
  type Update = (Patchnote & { type: string; isExtension: false; releasedAt: Date }) | (Extension & { type: string; isExtension: true; releasedAt: string });
  
  const timelineItems: Update[] = [
    ...patchnotes.map((p) => ({
      ...p,
      type: p.importance,
      isExtension: false as const,
      releasedAt: p.releasedAt,
    })),
    ...extensions.map((e) => ({
      ...e,
      type: "extension",
      isExtension: true as const,
      releasedAt: e.releasedAt,
    })),
  ];

  // Filtering
  const filteredUpdates = timelineItems.filter((item) => {
    const itemDate = new Date(item.releasedAt);
    const afterFrom = dateFrom ? itemDate >= new Date(dateFrom) : true;
    const beforeTo = dateTo ? itemDate <= new Date(dateTo) : true;
    const matchesType = checkedTypes.includes(item.type);
    return afterFrom && beforeTo && matchesType;
  });

  // Group by year
  const groupedByYear = filteredUpdates.reduce((acc, item) => {
    const year = new Date(item.releasedAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<number, typeof filteredUpdates>);

  const years = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();

  // Toggle year dropdown
  const toggleYear = (year: number) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  // Checkbox handler
  const handleTypeChange = (type: string) => {
    setCheckedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <section>
      <div className="items-center justify-between mb-4 md:flex">
        <h2 className="mb-6 text-3xl font-bold font-montserrat text-nowrap">
          Dernières mises à jour
        </h2>
        <button 
          onClick={handleAddPatchnote}
          className="px-4 py-2 font-bold transition duration-200 rounded bg-secondary hover:bg-primary text-off-white"
        >
          {isAuthenticated ? "Ajouter une patchnote" : "Connecter vous pour ajouter une patchnote"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <label className="block mb-1 text-sm">Du</label>
            <input
              type="date"
              className="p-2 rounded bg-off-gray border-1 border-gray-200/50 text-off-white focus:outline-none focus:ring-2 focus:ring-secondary"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            {dateFrom && (
              <button
                className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2 hover:text-white"
                onClick={() => setDateFrom("")}
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <label className="block mb-1 text-sm">Au</label>
            <input
              type="date"
              className="p-2 rounded bg-off-gray border-1 border-gray-200/50 text-off-white focus:outline-none focus:ring-2 focus:ring-secondary"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {dateTo && (
              <button
                className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2 hover:text-white"
                onClick={() => setDateTo("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {PATCHNOTE_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={checkedTypes.includes(t.value)}
                onChange={() => handleTypeChange(t.value)}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        {years.length === 0 ? (
            <p className="text-gray-500">
            Il n&apos;y a aucune mise à jour répertoriée. Vous en avez trouvé une ?{" "}
            <button onClick={handleAddPatchnote} className="underline text-secondary">
              Ajoutez la ici !
            </button>
            </p>
        ) : (
          years.map((year) => {
            const yearItems = groupedByYear[year];
            const extensionsList = yearItems.filter(
              (i) => i.type === "extension"
            );
            const majorCount = yearItems.filter(
              (i) => i.type === "major"
            ).length;
            const minorCount = yearItems.filter(
              (i) => i.type === "minor"
            ).length;
            const hotfixCount = yearItems.filter(
              (i) => i.type === "hotfix"
            ).length;
            const timelineSorted = [...yearItems].sort(
              (a, b) =>
                new Date(b.releasedAt).getTime() -
                new Date(a.releasedAt).getTime()
            );
            const isOpen = year === currentYear || openYears[year];

            return (
              <div key={year} className="mb-6">
                <button
                  className="w-full text-left bg-[#232323] rounded p-4 font-bold flex items-center justify-between gap-4"
                  onClick={() => year !== currentYear && toggleYear(year)}
                  disabled={year === currentYear}
                  style={
                    year === currentYear
                      ? { cursor: "default", opacity: 0.8 }
                      : {}
                  }
                >
                  <span className="flex flex-col gap-2">
                    <span>
                      {year} — {extensionsList.length} extension
                      {extensionsList.length !== 1 && "s"}, {majorCount} maj.,{" "}
                      {minorCount} mineure
                      {minorCount !== 1 && "s"}, {hotfixCount} hotfix
                      {hotfixCount !== 1 && "es"}
                    </span>
                    {extensionsList.length > 0 && (
                      <span className="flex gap-2 mt-1">
                        {extensionsList.map((ext) => (
                          <span
                            key={ext.id}
                            className="flex-shrink-0 w-8 h-12 bg-[#2a2a2a] rounded overflow-hidden flex flex-col items-center justify-center"
                            title={ext.title}
                          >
                            <Image
                              src={"imageUrl" in ext ? ext.imageUrl : ""}
                              alt={ext.title}
                              width={64}
                              height={96}
                              className="object-cover rounded"
                            />
                            <span className="text-[9px] text-gray-400 truncate w-full">
                              {ext.title}
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {year !== currentYear && <span>{isOpen ? "▲" : "▼"}</span>}
                </button>
                {isOpen && (
                  <div className="pl-8 mt-4">
                    {/* Timeline verticale */}
                    {/* Todo: fix the responsive further */}
                    <div className="relative pl-8">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                      {timelineSorted.map((item) => (
                        <div
                          key={item.id + item.type}
                          className="relative mb-10"
                        >
                            <div className="absolute left-[-22px] top-1 w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a]"></div>
                            <div
                              className={`
                              mb-2 text-sm text-gray-400 text-left md:hidden
                              `}
                            >
                              <div>
                              {new Date(item.releasedAt).toLocaleDateString()}
                              </div>
                              <div>{formatDateDifference(item.releasedAt)}</div>
                            </div>
                            <div
                              className={`
                                absolute left-[-120px] top-0 text-right w-24 text-sm text-gray-400
                                sm:left-[-120px] sm:w-24
                                xs:left-[-80px] xs:w-16
                                max-md:hidden
                              `}
                            >
                              <div>
                                {new Date(item.releasedAt).toLocaleDateString()}
                              </div>
                              <div>{formatDateDifference(item.releasedAt)}</div>
                            </div>
                          {item.isExtension ? (
                            <div className="bg-[#232323] rounded-lg p-4 flex items-center gap-4">
                              <Image
                                src={"imageUrl" in item ? item.imageUrl : ""}
                                alt={item.title}
                                width={64}
                                height={96}
                                className="object-cover rounded"
                              />
                              <div>
                                <div className="text-lg font-bold">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Extension
                                </div>
                                <div className="text-sm text-gray-300">
                                  Sortie:{" "}
                                  {new Date(
                                    item.releasedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <PatchnoteCard patchnote={item} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

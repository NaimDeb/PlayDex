import React, { useState } from "react";
import { Patchnote } from "@/types/patchNoteType";
import { Extension } from "@/types/gameType";
import { PatchnoteCard } from "@/components/ArticleCard/PatchnoteCard";
import Image from "next/image";
import Link from "next/link";

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
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [checkedTypes, setCheckedTypes] = useState<string[]>(
    PATCHNOTE_TYPES.map((t) => t.value)
  );
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});

  // Combine and tag items
  const timelineItems = [
    ...patchnotes.map((p) => ({
      ...p,
      type: p.type || "minor", // fallback if type missing
      isExtension: false,
      releasedAt: p.releasedAt,
    })),
    ...extensions.map((e) => ({
      ...e,
      type: "extension",
      isExtension: true,
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
      <div className="mb-4 md:flex justify-between items-center">
        <h2 className="text-3xl font-bold font-montserrat mb-6 text-nowrap">
          Dernières mises à jour
        </h2>
        <button className="bg-secondary hover:bg-primary text-off-white font-bold py-2 px-4 rounded transition duration-200">
          <Link href={`${window.location.pathname}/patchnote/new`}>
            Ajouter une patchnote
          </Link>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <label className="block text-sm mb-1">Du</label>
            <input
              type="date"
              className="bg-off-gray border-1 border-gray-200/50 text-off-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            {dateFrom && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setDateFrom("")}
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm mb-1">Au</label>
            <input
              type="date"
              className="bg-off-gray border-1 border-gray-200/50 text-off-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {dateTo && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
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
            <Link href={`${window.location.pathname}/patchnote/new`} className="text-secondary underline">
              Ajoutez la ici !
            </Link>
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
                          className="mb-10 relative"
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
                                className="rounded object-cover"
                              />
                              <div>
                                <div className="font-bold text-lg">
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

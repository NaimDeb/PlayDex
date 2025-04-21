"use client"; // Needed for useState and useEffect

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { Extension, Game } from "@/types/gameType";
import gameService from "@/lib/gameService";
import { Patchnote } from "@/types/patchNoteType";
import { notFound, useRouter } from "next/navigation";
import { PatchnoteCard } from "@/components/PatchnoteCard";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);
  const parts = slug.split("-");
  const id = parts.pop(); // Assumes ID is the last part

  const [gameData, setGameData] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]); // Explicitly define the type as Patchnote[]
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [image, setImage] = useState<string>("/no_cover.png"); // Assuming extensions is an array of objects

  // --- Filter State ---
  const [showNews, setShowNews] = useState(true);
  const [showMajor, setShowMajor] = useState(true);
  const [showMinor, setShowMinor] = useState(true);
  const [showHotfix, setShowHotfix] = useState(true);
  // Add date range filters if needed

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) {
          throw new Error("Invalid game ID.");
        }
        const data = await gameService.getGameById(id);
        setGameData(data);

        // Fetch patchnotes
        const patchnotesData = await gameService.getGamePatchNotes(id);
        setPatchnotes(Array.isArray(patchnotesData) ? patchnotesData : []);

        // Fetch extensions if available
        if (data.extensions && data.extensions.length > 0) {
          const extensionsData = await gameService.getGameExtensions(id);
          setExtensions(extensionsData);
        }

        // Set the image

        if (data.imageUrl) {
          const imageUrl = data.imageUrl.replace("t_thumb", "t_cover_big_2x"); // Adjust the image size as needed
          // console.log("image url ", imageUrl);

          setImage(imageUrl);
        }
      } catch (err) {
        setError("Failed to load game data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]); // Re-fetch if id changes

// --- Slug Logic ---
  const sluggified =
    gameData && id
      ? `${gameData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${id}`
      : null;

  useEffect(() => {
    if (gameData && id && slug !== sluggified) {
      router.replace(`/article/${sluggified}`);
    }
  }, [gameData, id, slug, sluggified, router]);


  // Combine patchnotes and extensions for timeline
  const timelineItems = [
    ...patchnotes.map((patchnote) => ({ ...patchnote, type: "patchnote" })),
    ...extensions.map((extension) => ({ ...extension, type: "extension" })),
  ];

  // --- Filter Logic ---
  const filteredUpdates = timelineItems.filter((item) => {
    if (item.type === "patchnote") {
      const patchnoteItem = item as Patchnote; // Merci typescript
      if (patchnoteItem.importance === "major" && !showMajor) return false;
      if (patchnoteItem.importance === "minor" && !showMinor) return false;
      if (patchnoteItem.importance === "hotfix" && !showHotfix) return false;
    }
    if (!showNews && item.type === "extension") return false; // Assuming showNews includes updates and dlc for now
    return true;
  });

  // --- Timeline Grouping ---
  const currentYear = new Date().getFullYear();
  const groupedByYear = filteredUpdates.reduce((acc, item) => {
    const year = new Date(item.releasedAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<number, typeof filteredUpdates>);

  const [openYears, setOpenYears] = useState<{ [year: number]: boolean }>({});

  const toggleYear = (year: number) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

    const toggleLoad = () => {
    setIsLoading(!isLoading);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Skeleton className="h-10 w-1/2 mx-auto mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
      </div>
    );
  }


  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!gameData) {
    notFound();
  }

  /**
   * Formats the date difference between now and the given date.
   * @param date
   * @returns
   */
  const formatDateDifference = (date: Date | string): string => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - parsedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays <= 1) return "Il y a 1 jour";
    if (diffDays < 365) return `Il y a ${diffDays} jours`;
    if (diffYears === 1) return "Il y a 1 an";
    return `Il y a ${diffYears} ans`;
  };

  // console.log("extensions : ", extensions);

  return (
    <div className="bg-off-black text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        {/* --- Game Info Section --- */}
        <section className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <Image
              src={image}
              alt={`${gameData.title} Cover Art`}
              width={300} // Adjust size as needed
              height={450} // Adjust size as needed
              className="rounded-lg object-cover w-full"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">
              {gameData.title}
            </h1>{" "}
            {/* Assuming font-montserrat */}
            <div className="flex gap-3 text-off-white underline text-nowrap flex-wrap">
              {gameData.companies.map((company) => (
                <p
                  key={company.id}
                  className="text-lg hover:text-gray-300 cursor-pointer mb-1"
                >
                  {company.name}
                </p>
              ))}
            </div>
            {/* Genres */}
            <div className="flex gap-3 text-off-white underline text-nowrap flex-wrap mb-4">
              {gameData.genres.map((genre) => (
                <p
                  key={genre.id}
                  className="text-lg hover:text-gray-300 cursor-pointer mb-1"
                >
                  {genre.name}
                </p>
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Sorti en {new Date(gameData.releasedAt).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-4 mb-6">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition duration-200">
                Suivi
              </button>
              {/* Add the circle button if needed */}
            </div>
            <p className="text-gray-300 leading-relaxed">
              {gameData.description}
            </p>
          </div>
        </section>

        {/* --- Patchnotes Section --- */}
        {/* --- Extensions Section --- */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-montserrat">
              {gameData.extensions.length} Extension
              {gameData.extensions.length > 1 && "s"}
            </h2>
            <button className="text-purple-400 hover:text-purple-300">
              Tout voir
            </button>
          </div>
          {/* Basic Carousel Placeholder - Replace with a real carousel component */}
          <div className="relative">
            {/* Add Arrow buttons here */}
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {extensions.map((extension) => (
                <div
                  key={extension.id}
                  className="flex-shrink-0 w-40 bg-[#2a2a2a] rounded p-2 textension-center"
                >
                  <Image
                    src={extension.imageUrl}
                    alt={extension.title}
                    width={150}
                    height={200}
                    className="object-cover rounded mb-2 mx-auto"
                  />
                  <p className="text-sm font-semibold">{extension.title}</p>
                  <p className="text-xs text-gray-400">
                    Sortie:{" "}
                    {new Date(extension.releasedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Updates Timeline Section --- */}
        <section>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-3xl font-bold font-montserrat mb-6">
              Dernières mises à jour
            </h2>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200">
                <Link href={`${slug}/patchnote/new`}>
                Ajouter un patchnote
                </Link>
            </button>
          </div>
          {/* Filters */}
          <div className="bg-[#2a2a2a] p-4 rounded-lg mb-8 flex flex-wrap gap-4 items-center">
            {/* Add Date Range Pickers Here if needed: Du: Au: */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-news"
                checked={showNews}
                onChange={(e) => setShowNews(e.target.checked)}
                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="filter-news">Nouveautés</label>{" "}
              {/* Includes updates and dlc for now */}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-major"
                checked={showMajor}
                onChange={(e) => setShowMajor(e.target.checked)}
                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="filter-major">Majeures</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-minor"
                checked={showMinor}
                onChange={(e) => setShowMinor(e.target.checked)}
                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="filter-minor">Mineures</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-hotfix"
                checked={showHotfix}
                onChange={(e) => setShowHotfix(e.target.checked)}
                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="filter-hotfix">Hotfixes</label>
            </div>
          </div>

          {/* Timeline for current year */}
          <div className="relative pl-8 mt-16">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
            {groupedByYear[currentYear] &&
            groupedByYear[currentYear].length > 0 ? (
              groupedByYear[currentYear].map((item, index) => (
                <div key={item.id + item.type} className="mb-10 relative">
                  <div className="absolute left-[-22px] top-1 w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a]"></div>
                  <div className="absolute left-[-120px] top-0 text-right w-24 text-sm text-gray-400">
                    <div>{new Date(item.releasedAt).toLocaleDateString()}</div>
                    <div>{formatDateDifference(item.releasedAt)}</div>
                  </div>
                  {/* Render Patchnote or Extension */}
                  {item.type === "patchnote" ? (
                    <PatchnoteCard update={item} />
                  ) : (
                    <div className="bg-[#232323] rounded-lg p-4 flex items-center gap-4">
                      <Image
                        src={"imageUrl" in item ? item.imageUrl : ""}
                        alt={item.title}
                        width={60}
                        height={80}
                        className="rounded object-cover"
                      />
                      <div>
                        <div className="font-bold text-lg">{item.title}</div>
                        <div className="text-xs text-gray-400">Extension</div>
                        <div className="text-sm text-gray-300">
                          Sortie:{" "}
                          {new Date(item.releasedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Year marker logic unchanged */}
                  {index > 0 &&
                    new Date(item.releasedAt).getFullYear() !==
                      new Date(
                        filteredUpdates[index - 1].releasedAt
                      ).getFullYear() && (
                      <div className="absolute left-[-22px] top-[-40px] w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a] flex items-center justify-center"></div>
                    )}
                  {index === 0 && (
                    <div className="absolute left-[-120px] top-[-40px] text-right w-24 font-bold text-lg">
                      {new Date(item.releasedAt).getFullYear()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No updates this year.</p>
            )}
          </div>

          {/* Dropdowns for previous years */}
          <div className="mt-12">
            {Object.keys(groupedByYear)
              .map(Number)
              .filter((year) => year !== currentYear)
              .sort((a, b) => b - a)
              .map((year) => {
                const yearItems = groupedByYear[year];
                const extensionsList = yearItems.filter(
                  (i) => i.type === "extension"
                );
                const timelineSorted = [...yearItems].sort(
                  (a, b) =>
                    new Date(b.releasedAt).getTime() -
                    new Date(a.releasedAt).getTime()
                );
                const majorCount = yearItems.filter(
                  (i) =>
                    i.type === "patchnote" &&
                    "importance" in i &&
                    i.importance === "major"
                ).length;
                const minorCount = yearItems.filter(
                  (i) =>
                    i.type === "patchnote" &&
                    "importance" in i &&
                    i.importance === "minor"
                ).length;
                const hotfixCount = yearItems.filter(
                  (i) =>
                    i.type === "patchnote" &&
                    "importance" in i &&
                    i.importance === "hotfix"
                ).length;
                return (
                  <div key={year} className="mb-6">
                    <button
                      className="w-full text-left bg-[#232323] rounded p-4 font-bold flex items-center justify-between gap-4"
                      onClick={() => toggleYear(year)}
                    >
                      <span className="flex flex-col gap-2">
                        <span>
                          {year} — {extensionsList.length} extension
                          {extensionsList.length !== 1 && "s"}, {majorCount}{" "}
                          maj., {minorCount} mineure{minorCount !== 1 && "s"},{" "}
                          {hotfixCount} hotfix{hotfixCount !== 1 && "es"}
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
                      <span>{openYears[year] ? "▲" : "▼"}</span>
                    </button>
                    {openYears[year] && (
                      <div className="pl-8 mt-4">
                        {/* Timeline verticale */}
                        <div className="relative pl-8">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>
                          {timelineSorted.map((item) => (
                            <div
                              key={item.id + item.type}
                              className="mb-10 relative"
                            >
                              <div className="absolute left-[-22px] top-1 w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a]"></div>
                              <div className="absolute left-[-120px] top-0 text-right w-24 text-sm text-gray-400">
                                <div>
                                  {new Date(
                                    item.releasedAt
                                  ).toLocaleDateString()}
                                </div>
                                <div>
                                  {formatDateDifference(item.releasedAt)}
                                </div>
                              </div>
                              {item.type === "patchnote" ? (
                                <PatchnoteCard update={item} />
                              ) : (
                                <div className="bg-[#232323] rounded-lg p-4 flex items-center gap-4">
                                  <Image
                                    src={
                                      "imageUrl" in item ? item.imageUrl : ""
                                    }
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
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

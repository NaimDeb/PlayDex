"use client";
import { useState, useEffect, use } from "react";
import { Extension, Game } from "@/types/gameType";
import gameService from "@/lib/gameService";
import { Patchnote } from "@/types/patchNoteType";
import { notFound, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { GameArticleSkeleton } from "@/components/Skeletons/GameArticleSkeleton";
import { GameInfoSection } from "@/components/ArticlePage/GameInfoSection";
import { ExtensionsSection } from "@/components/ArticlePage/ExtensionsSection";
import { UpdatesTimelineSection } from "@/components/ArticlePage/UpdatesTimelineSection";

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { slug } = use(params);
  const parts = slug.split("-");
  const id = parts.pop();

  const [gameData, setGameData] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]); // Explicitly define the type as Patchnote[]
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [image, setImage] = useState<string>("/no_cover.png"); // Assuming extensions is an array of objects

  // --- Filter State ---

  // Todo : date range filter
  // const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // loads the game data and patchnotes when the component mounts or when the id changes
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
        document.title = "Playdex - " + data.title;

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
          const imageUrl = changeIgdbImageFormat(
            data.imageUrl,
            IgdbImageFormat.CoverBig2x
          );

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

  // Check if the slug in the URL matches the sluggified version
  useEffect(() => {
    if (gameData && id && slug !== sluggified) {
      router.replace(`/article/${sluggified}`);
    }
  }, [gameData, id, slug, sluggified, router]);





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

  if (isLoading) {
    return <GameArticleSkeleton />;
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

  return (
    <div className="bg-off-black text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs>
          <BreadcrumbItem href="/">Accueil</BreadcrumbItem>
          <BreadcrumbItem>Jeu</BreadcrumbItem>
        </Breadcrumbs>
        <GameInfoSection
          gameData={gameData}
          image={image}
          isAuthenticated={isAuthenticated}
        />
        <ExtensionsSection extensions={extensions} />
        <UpdatesTimelineSection
          patchnotes={patchnotes}
          extensions={extensions}
          formatDateDifference={formatDateDifference}
        />
      </div>
    </div>
  );
}

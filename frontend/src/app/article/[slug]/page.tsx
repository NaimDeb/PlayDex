"use client";
import { useState, useEffect, use } from "react";
import { Extension, Game } from "@/types/gameType";
import gameService from "@/lib/api/gameService";
import { Patchnote } from "@/types/patchNoteType";
import { notFound, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { GameArticleSkeleton } from "@/components/Skeletons/GameArticleSkeleton";
import { GameInfoSection } from "@/components/ArticlePage/GameInfoSection";
import { UpdatesTimelineSection } from "@/components/ArticlePage/UpdatesTimelineSection";
import { useFollowedGames } from "@/providers/FollowedGamesProvider";
import { PageSection } from "@/components/PageSection";
import { useTranslation } from "@/i18n/TranslationProvider";

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isAuthenticated } = useAuth();
  const { followedGameIds }  = useFollowedGames();
  const { t }               = useTranslation();
  const router               = useRouter();
  const { slug }             = use(params);
  const id                   = slug.split("-").pop();

  const [gameData,   setGameData]   = useState<Game | null>(null);
  const [isLoading,  setIsLoading]  = useState<boolean>(true);
  const [error,      setError]      = useState<string | null>(null);
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [image,      setImage]      = useState<string>("/no_cover.png");

  useEffect(() => {
    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        if (!id) throw new Error("Invalid game ID.");

        const data = await gameService.getGameById(id);
        setGameData(data);
        document.title = `Playdex - ${data.title}`;

        const [patchnotesData, extensionsData] = await Promise.all([
          gameService.getGamePatchNotes(id),
          data.extensions?.length > 0
            ? gameService.getGameExtensions(id)
            : Promise.resolve([]),
        ]);

        setPatchnotes(Array.isArray(patchnotesData) ? patchnotesData : []);
        setExtensions(Array.isArray(extensionsData) ? extensionsData : []);

        if (data.imageUrl) {
          setImage(changeIgdbImageFormat(data.imageUrl, IgdbImageFormat.CoverBig2x));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load game data.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [id]);

  // Mark followed games as checked
  useEffect(() => {
    if (isAuthenticated && id && gameData && followedGameIds.includes(id)) {
      void gameService.postCheckGame(id);
    }
  }, [isAuthenticated, id, gameData, followedGameIds]);

  // Canonical slug redirect
  const sluggified =
    gameData && id
      ? `${gameData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${id}`
      : null;

  useEffect(() => {
    if (sluggified && slug !== sluggified) {
      router.replace(`/article/${sluggified}`);
    }
  }, [slug, sluggified, router]);

  const formatDateDifference = (date: Date | string): string => {
    const parsed   = typeof date === "string" ? new Date(date) : date;
    const diffDays = Math.ceil(
      Math.abs(Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
    );
    const diffYears = Math.floor(diffDays / 365);
    if (diffDays <= 1)  return t("time.oneDay");
    if (diffDays < 365) return t("time.daysAgo", { count: diffDays });
    if (diffYears === 1) return t("time.oneYear");
    return t("time.yearsAgo", { count: diffYears });
  };

  // ── Early returns — after all hooks, TypeScript happy ──────────────
  if (isLoading) return <GameArticleSkeleton />;

  if (error) return (
    <p className="py-16 text-center text-red-500">{error}</p>
  );

  // notFound() ne renvoie jamais (type `never`), ce qui permet à TS de
  // savoir que gameData est non-null dans tout le JSX qui suit.
  if (!gameData) return notFound();

  return (
    <main className="min-h-screen text-white bg-off-black">
      <PageSection className="py-8">
        <nav aria-label="Fil d'Ariane">
          <Breadcrumbs>
            <BreadcrumbItem href="/">{t("game.breadcrumbHome")}</BreadcrumbItem>
            <BreadcrumbItem>{t("game.breadcrumbGame")}</BreadcrumbItem>
          </Breadcrumbs>
        </nav>

        <GameInfoSection
          gameData={gameData}
          extensions={extensions}
          image={image}
          isAuthenticated={isAuthenticated}
        />

        <UpdatesTimelineSection
          patchnotes={patchnotes}
          extensions={extensions}
          formatDateDifference={formatDateDifference}
        />
      </PageSection>
    </main>
  );
}
"use client";

import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { ClassicCard } from "@/components/ArticleCard/ClassicCard";
import { PageSection } from "@/components/PageSection";
import { useAuth } from "@/providers/AuthProvider";
import gameService from "@/lib/api/gameService";
import { FollowedGameWithCount, Game } from "@/types/gameType";
import { Patchnote } from "@/types/patchNoteType";
import { PatchnoteCard } from "@/components/ArticleCard/PatchnoteCard";
import Link from "next/link";
import { useTranslation } from "@/i18n/TranslationProvider";

const GameCardPlaceholder = () => (
  <div
    className="flex-shrink-0 bg-[#2a2a2a] rounded animate-pulse"
    style={{ width: "200px", height: "300px" }}
  />
);

const PatchnoteCardPlaceholder = () => (
  <div className="bg-[#2a2a2a] rounded-lg p-4 animate-pulse">
    <div className="h-3 w-20 bg-gray-700 rounded mb-2" />
    <div className="h-4 w-3/4 bg-gray-700 rounded mb-3" />
    <div className="flex gap-3 mb-3">
      <div className="h-3 w-24 bg-gray-700 rounded" />
      <div className="h-5 w-16 bg-gray-700 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full bg-gray-700 rounded" />
      <div className="h-3 w-5/6 bg-gray-700 rounded" />
      <div className="h-3 w-2/3 bg-gray-700 rounded" />
    </div>
    <div className="flex justify-end">
      <div className="h-8 w-32 bg-gray-700 rounded" />
    </div>
  </div>
);

export default function Home() {
  const [followedGames, setFollowedGames] = useState<FollowedGameWithCount[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [latestPatchnotes, setLatestPatchnotes] = useState<{ patchnote: Patchnote; game: Game }[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [followed, nouveautes, patchnotes] = await Promise.all([
        isAuthenticated
          ? gameService.getFollowedGames?.() ?? []
          : Promise.resolve([]),
        gameService.getLatestReleases(),
        gameService.getLatestPatchnotes(),
      ]);

      // Fetch full game data for each patchnote
      const patchnotesWithGames = await Promise.all(
        patchnotes.map(async (patchnote) => {
          let gameId: string | null = null;
          if (typeof patchnote.game === "object") {
            gameId = String(patchnote.game.id);
          } else if (typeof patchnote.game === "string") {
            // IRI format: "/api/games/5" or "/games/5"
            const match = patchnote.game.match(/\/games\/(\d+)/);
            if (match) gameId = match[1];
          }
          const game = gameId ? await gameService.getGameById(gameId) : null;
          return game ? { patchnote, game } : null;
        })
      );

      setFollowedGames(followed);
      setNewGames(nouveautes);
      setLatestPatchnotes(patchnotesWithGames.filter((p): p is { patchnote: Patchnote; game: Game } => p !== null));
      setLoading(false);
    }
    fetchData();
  }, [isAuthenticated]);

  return (
    <>
      <section className="w-full bg-hero bg-cover bg-center mb-12" style={{ height: "40vh", minHeight: "280px" }}>
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 h-full
          flex items-center justify-between max-md:justify-center gap-8">

          <div className="max-md:hidden flex-shrink-0">
            <Logo width={240} height={240} />
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            {isAuthenticated ? (
              <>
                <h1 className="text-2xl font-bold lg:text-4xl drop-shadow-lg">
                  {t("home.welcomeTitle")}<br />
                  {t("home.welcomeSubtitle")}
                </h1>
                <Link
                  href="/profile"
                  className="px-5 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600"
                >
                  {t("home.viewProfile")}
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold lg:text-4xl drop-shadow-lg">
                  {t("home.heroTitle")}<br />
                  {t("home.heroSubtitle")}
                </h1>
                <Link
                  href="/register"
                  className="px-5 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600"
                >
                  {t("home.signUp")}
                </Link>
                <p className="text-sm drop-shadow">
                  {t("home.alreadyHaveAccount")}{" "}
                  <Link href="/login" className="underline">{t("home.connectNow")}</Link>
                </p>
              </>
            )}
          </div>

        </div>
      </section>

      {isAuthenticated && (
        <PageSection
          title={t("home.myListTitle")}
          seeMoreLabel={t("home.seeAllMyList")}
          seeMoreHref="/profile"
        >
          <ul className="flex gap-4 pb-4 overflow-x-auto list-none">
            {loading
              ? [...Array(6)].map((_, i) => <li key={`followed-${i}`}><GameCardPlaceholder /></li>)
              : followedGames.map((data) => (
                  <li key={data.game.id}>
                    <ClassicCard
                      game={data.game}
                      updatesCount={data.newPatchnoteCount}
                      isAuthenticated={isAuthenticated}
                    />
                  </li>
                ))}
          </ul>
        </PageSection>
      )}

      <PageSection
        title={t("home.latestGamesTitle")}
        seeMoreLabel={t("home.seeAllLatestGames")}
        seeMoreHref="/search?category=jeux"
      >
        <ul className="flex gap-4 pb-4 overflow-x-auto list-none">
          {loading
            ? [...Array(6)].map((_, i) => <li key={`new-${i}`}><GameCardPlaceholder /></li>)
            : newGames.map((game) => (
                <li key={game.id}>
                  <ClassicCard game={game} isAuthenticated={isAuthenticated} />
                </li>
              ))}
        </ul>
      </PageSection>

      <PageSection title={t("home.latestPatchnotesTitle")}>
        <div className="flex flex-col gap-6">
          {loading
            ? [...Array(2)].map((_, i) => (
                <div key={`patchnote-${i}`} className="flex gap-4 items-start">
                  <GameCardPlaceholder />
                  <div className="flex-1"><PatchnoteCardPlaceholder /></div>
                </div>
              ))
            : latestPatchnotes.slice(0, 2).map(({ patchnote, game }) => (
                <div key={patchnote.id} className="flex gap-4 items-stretch sm:h-[300px]">
                  <div className="flex-shrink-0 hidden sm:block">
                    <ClassicCard game={game} isAuthenticated={isAuthenticated} />
                  </div>
                  <div className="flex-1 min-w-0 sm:h-full">
                    <PatchnoteCard
                      patchnote={{
                        ...patchnote,
                        gameName: game.title,
                      }}
                      baseUrl={`/article/${game.id}`}
                    />
                  </div>
                </div>
              ))}
        </div>
      </PageSection>
    </>
  );
}

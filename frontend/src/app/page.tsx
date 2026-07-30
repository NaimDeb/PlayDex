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
import { readCache, writeCache } from "@/lib/api/responseCache";

// ─── Cache ────────────────────────────────────────────────────────────────────

/** Nouveautés + dernières patchnotes : identiques pour tous, inutile de les
 *  retélécharger à chaque retour sur l'accueil. */
const PUBLIC_DATA_CACHE_KEY = "home:public";
const PUBLIC_DATA_CACHE_TTL = 5 * 60 * 1000;

type PatchnoteWithGame = { patchnote: Patchnote; game: Game };

interface HomePublicData {
  newGames: Game[];
  latestPatchnotes: PatchnoteWithGame[];
}

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
  const [latestPatchnotes, setLatestPatchnotes] = useState<PatchnoteWithGame[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Données publiques : servies depuis le cache tant qu'il est frais.
  useEffect(() => {
    let cancelled = false;

    const cached = readCache<HomePublicData>(PUBLIC_DATA_CACHE_KEY);
    if (cached) {
      setNewGames(cached.newGames);
      setLatestPatchnotes(cached.latestPatchnotes);
      setLoadingPublic(false);
      return;
    }

    async function fetchPublicData() {
      const [nouveautes, patchnotes] = await Promise.all([
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

      const data: HomePublicData = {
        newGames: nouveautes,
        latestPatchnotes: patchnotesWithGames.filter((p): p is PatchnoteWithGame => p !== null),
      };
      writeCache(PUBLIC_DATA_CACHE_KEY, data, PUBLIC_DATA_CACHE_TTL);

      if (cancelled) return;
      setNewGames(data.newGames);
      setLatestPatchnotes(data.latestPatchnotes);
      setLoadingPublic(false);
    }

    fetchPublicData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Liste suivie : propre à l'utilisateur et modifiable à tout moment (bouton
  // "Suivre"), donc jamais mise en cache.
  useEffect(() => {
    let cancelled = false;

    async function fetchFollowedGames() {
      setLoadingFollowed(true);
      const followed = isAuthenticated
        ? await (gameService.getFollowedGames?.() ?? Promise.resolve([]))
        : [];

      if (cancelled) return;
      setFollowedGames(followed);
      setLoadingFollowed(false);
    }

    fetchFollowedGames();

    return () => {
      cancelled = true;
    };
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
          {!loadingFollowed && followedGames.length === 0 ? (
            <p className="text-sm text-off-white/60">
              {t("home.emptyList")}{" "}
              <Link href="/search" className="underline hover:text-off-white">
                {t("home.emptyListCta")}
              </Link>
            </p>
          ) : (
            <ul className="flex gap-4 pb-4 overflow-x-auto list-none">
              {loadingFollowed
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
          )}
        </PageSection>
      )}

      <PageSection
        title={t("home.latestGamesTitle")}
        seeMoreLabel={t("home.seeAllLatestGames")}
        seeMoreHref="/search?category=jeux"
      >
        <ul className="flex gap-4 pb-4 overflow-x-auto list-none">
          {loadingPublic
            ? [...Array(6)].map((_, i) => <li key={`new-${i}`}><GameCardPlaceholder /></li>)
            : newGames.map((game) => (
                <li key={game.id}>
                  <ClassicCard game={game} isAuthenticated={isAuthenticated} />
                </li>
              ))}
        </ul>
      </PageSection>

      <PageSection title={t("home.latestPatchnotesTitle")}>
        <ul className="flex flex-col gap-6 list-none">
          {loadingPublic
            ? [...Array(2)].map((_, i) => (
                <li key={`patchnote-${i}`} className="flex gap-4 items-start">
                  <GameCardPlaceholder />
                  <div className="flex-1"><PatchnoteCardPlaceholder /></div>
                </li>
              ))
            : latestPatchnotes.slice(0, 2).map(({ patchnote, game }) => (
                <li key={patchnote.id} className="flex gap-4 items-stretch sm:h-[300px]">
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
                </li>
              ))}
        </ul>
      </PageSection>
    </>
  );
}

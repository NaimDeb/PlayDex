"use client";

import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { ClassicCard } from "@/components/ArticleCard/ClassicCard";
import { PageSection } from "@/components/PageSection";
import { useAuth } from "@/providers/AuthProvider";
import gameService from "@/lib/api/gameService";
import { FollowedGameWithCount, Game } from "@/types/gameType";
import Link from "next/link";
import { useTranslation } from "@/i18n/TranslationProvider";

const GameCardPlaceholder = () => (
  <div
    className="flex-shrink-0 bg-[#2a2a2a] rounded animate-pulse"
    style={{ width: "200px", height: "300px" }}
  />
);

export default function Home() {
  const [followedGames, setFollowedGames] = useState<FollowedGameWithCount[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [followed, nouveautes] = await Promise.all([
        isAuthenticated
          ? gameService.getFollowedGames?.() ?? []
          : Promise.resolve([]),
        gameService.getLatestReleases(),
      ]);
      setFollowedGames(followed);
      setNewGames(nouveautes);
      setLoading(false);
    }
    fetchData();
  }, [isAuthenticated]);

  return (
    <main>
      <header className="w-full bg-hero bg-cover bg-center mb-12" style={{ height: "40vh", minHeight: "280px" }}>
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 h-full
          flex items-center justify-between max-md:justify-center gap-8">

          <figure className="max-md:hidden flex-shrink-0">
            <Logo width={240} height={240} />
          </figure>

          <aside className="flex flex-col items-center gap-4 text-center">
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
          </aside>

        </div>
      </header>

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
    </main>
  );
}

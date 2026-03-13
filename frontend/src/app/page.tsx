"use client";

import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { ClassicCard } from "@/components/ArticleCard/ClassicCard";
import { PageSection } from "@/components/PageSection";
import { useAuth } from "@/providers/AuthProvider";
import gameService from "@/lib/api/gameService";
import { FollowedGameWithCount, Game } from "@/types/gameType";
import Link from "next/link";

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
      {/* ── Hero ───────────────────────────────────────────────
          - bg-hero s'étend sur toute la largeur
          - le contenu intérieur reste dans le container 1440px
          - pas de boîte sur le texte : tout flotte sur l'image
      ───────────────────────────────────────────────────────── */}
      <header className="w-full bg-hero bg-cover bg-center mb-12" style={{ height: "40vh", minHeight: "280px" }}>
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 h-full
          flex items-center justify-between max-md:justify-center gap-8">

          {/* Logo — gauche, visible desktop seulement */}
          <figure className="max-md:hidden flex-shrink-0">
            <Logo width={240} height={240} />
          </figure>

          {/* CTA — droite, texte flottant directement sur le bg */}
          <aside className="flex flex-col items-center gap-4 text-center">
            {isAuthenticated ? (
              <>
                <h1 className="text-2xl font-bold lg:text-4xl drop-shadow-lg">
                  Bienvenue sur PlayDex !<br />
                  Retrouvez toutes les nouveautés de vos jeux suivis.
                </h1>
                <Link
                  href="/profile"
                  className="px-5 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600"
                >
                  Voir mon profil
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold lg:text-4xl drop-shadow-lg">
                  Ne rate plus aucun patch !<br />
                  Inscris-toi maintenant.
                </h1>
                <button className="px-5 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600">
                  S&apos;inscrire
                </button>
                <p className="text-sm drop-shadow">
                  Déjà un compte ?{" "}
                  <a href="#" className="underline">Connectez-vous</a>
                </p>
              </>
            )}
          </aside>

        </div>
      </header>

      {/* ── Ma liste ───────────────────────────────────────── */}
      {isAuthenticated && (
        <PageSection
          title="Ma liste"
          seeMoreLabel="Voir toute ma liste"
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

      {/* ── Derniers jeux ajoutés ──────────────────────────── */}
      <PageSection
        title="Derniers jeux ajoutés"
        seeMoreLabel="Voir tous les derniers jeux ajoutés"
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
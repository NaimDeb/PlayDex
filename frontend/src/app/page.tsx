"use client";

import { Logo } from "@/components/Logo";
import React from "react";
import { useEffect, useState } from "react";
import { ClassicCard } from "@/components/ArticleCard/ClassicCard";
import { useAuth } from "@/providers/AuthProvider";
import gameService from "@/lib/api/gameService";
import { FollowedGameWithCount, Game } from "@/types/gameType";
import Link from "next/link";

// Placeholder Card Component
const GameCardPlaceholder = () => (
  <div className="flex-shrink-0 w-48 h-64 m-2 bg-gray-700 rounded-lg animate-pulse">
    {/* You can add more details here later */}
  </div>
);

export default function Home() {
  const [followedGames, setFollowedGames] = useState<FollowedGameWithCount[]>([]);
  // const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [followed, nouveautes] = await Promise.all([
        isAuthenticated
          ? gameService.getAbsenceGames?.() ?? []
          : Promise.resolve([]),
        // Todo : Change to getLatestReleases quand l'endpoint marchera
        gameService.getLatestGames(),
      ]);
      setFollowedGames(followed);
      // setPopularGames(popular);
      setNewGames(nouveautes);
      setLoading(false);
    }
    fetchData();
  }, [isAuthenticated]);

  return (
    <>
      <div className="mb-12 h-[40vh] md:h-[30vh] flex items-center max-md:justify-center px-16 justify-between bg-gradient-to-r rounded-lg bg-hero">
        {/* Left side: Logo */}
        <div className="max-md:hidden">
          <Logo width={192} height={192} />
        </div>
        {/* Right side: Text content */}
        <div className="flex flex-col items-center justify-center p-4 px-12 text-center bg-black/20">
          {isAuthenticated ? (
        <>
          <h1 className="w-full mb-4 text-2xl font-bold lg:text-4xl">
            Bienvenue sur PlayDex !
            <br />
            Retrouvez toutes les nouveautés de vos jeux suivis.
          </h1>
          <div className="flex justify-center w-full">
            <Link
          href="/profile"
          className="px-4 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600"
            >
          Voir mon profil
            </Link>
          </div>
        </>
          ) : (
        <>
          <h1 className="w-full mb-4 text-2xl font-bold lg:text-4xl">
            Ne rate plus aucun patch !
            <br />
            Inscris-toi maintenant.
          </h1>
          <div className="flex justify-center w-full">
            <button className="px-4 py-2 font-bold text-white rounded bg-secondary hover:bg-gray-600">
          S&apos;inscrire
            </button>
          </div>
          <p className="w-full mt-4 text-sm">
            Déjà un compte ?{" "}
            <a href="#" className="underline">
          Connectez-vous
            </a>
          </p>
        </>
          )}
        </div>
      </div>




      {/*
        Pendant mon absence Section - Show only if logged in
      */}
      {isAuthenticated && (
        <section className="pl-4 mb-12 sm:px-16 lg:px-30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Pendant mon absence</h2>
            <a href="#" className="text-sm text-gray-400 hover:underline">
              Voir toute ma liste
            </a>
          </div>
          <div className="flex gap-3 pb-4 -mx-2 overflow-x-auto">
            {loading
              ? [...Array(6)].map((_, i) => (
                  <GameCardPlaceholder key={`followed-${i}`} />
                ))
              : followedGames.map((data) => (
                  <ClassicCard
                    key={data.followedGame.game.id}
                    game={data.followedGame.game}
                    updatesCount={data.newCount}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
          </div>
        </section>
      )}

      {/* Mises à jours populaires Section */}
      {/* <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Mises à jours populaires</h2>
          Optional: Add a link if needed 
        </div>
        <div className="flex pb-4 -mx-2 overflow-x-auto">
            {loading
            ? [...Array(6)].map((_, i) => (
              <GameCardPlaceholder key={`popular-${i}`} />
              ))
            : popularGames.map((game) => (
              <ClassicCard
                key={game.id}
                game={game}
                isDlc={game.isDlc ?? false}
                updatesCount={game.updatesCount ?? 0}
                isAuthenticated={false}
              />
              ))}
        </div>
      </section> */}

      {/* Nouveautées Section */}
      <section className="pl-4 mb-12 sm:px-16 lg:px-30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Nouveautées</h2>
          <a href="#" className="text-sm text-gray-400 hover:underline">
            Voir toutes les nouveautées
          </a>
        </div>
        <div className="flex gap-3 pb-4 -mx-2 overflow-x-auto">
          {loading
            ? [...Array(6)].map((_, i) => (
                <GameCardPlaceholder key={`new-${i}`} />
              ))
            : newGames.map((game) => (
                <ClassicCard
                  key={game.id}
                  game={game}
                  isAuthenticated={isAuthenticated}
                />
              ))}
        </div>
      </section>
    </>
  );
}

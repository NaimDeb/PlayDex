"use client";

import React, { useEffect, useState } from "react";
import gameService from "@/lib/api/gameService";
import { Game } from "@/types/gameType";
import { ClassicCard } from "@/components/ArticleCard";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";

// Add the type for absence games
interface AbsenceGame {
  followedGame: { game: Game };
  newCount: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [followedGames, setFollowedGames] = useState<AbsenceGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ajout des états pour la recherche et le tri
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // Use getAbsenceGames and cast to AbsenceGame[]
        const games = await gameService.getAbsenceGames();
        // If the response is an array of Game (fallback), map to AbsenceGame shape
        if (
          Array.isArray(games) &&
          games.length > 0 &&
          Object.prototype.hasOwnProperty.call(games[0], "followedGame")
        ) {
          setFollowedGames(games as unknown as AbsenceGame[]);
        } else if (Array.isArray(games)) {
          setFollowedGames(
            games.map((g: Game) => ({ followedGame: { game: g }, newCount: 0 }))
          );
        } else {
          setFollowedGames([]);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch followed games:", err);
        setError(
          "Impossible de charger votre liste de jeux suivis. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Fonction pour filtrer et trier les jeux suivis
  const filteredAndSortedGames = followedGames
    .filter((data) =>
      data.followedGame.game.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const gA = a.followedGame.game;
      const gB = b.followedGame.game;
      switch (sort) {
        case "date-desc":
          return (
            new Date(gB.releasedAt).getTime() -
            new Date(gA.releasedAt).getTime()
          );
        case "date-asc":
          return (
            new Date(gA.releasedAt).getTime() -
            new Date(gB.releasedAt).getTime()
          );
        case "name-asc":
          return gA.title.localeCompare(gB.title);
        case "name-desc":
          return gB.title.localeCompare(gA.title);
        default:
          return 0;
      }
    });

  // Fallback avatar if none is available
  const avatarUrl = "/logo.png";

  return (
    <div className="container px-4 py-8 mx-auto text-off-white">
      {/* Profile Header Section */}
      <section className="mb-12">
        <div className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-lg shadow-xl md:flex-row md:items-start md:gap-8 bg-opacity-70 backdrop-blur-sm">
          <div className="relative w-36 h-36 md:w-48 md:h-48">
            <Image
              src={avatarUrl}
              alt="User Avatar"
              fill
              className="object-cover border-4 rounded-full shadow-md bg-primary"
              sizes="(max-width: 768px) 9rem, 12rem"
              priority
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold lg:text-4xl font-montserrat [color:var(--color-primary)]">
              {user?.username || "Utilisateur"}
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              {user ? `ID: ${user.id}` : ""}
            </p>
            <p className="text-sm text-gray-300">
              {user
                ? `Utilisateur depuis le : ${
                    user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : ""
                  }`
                : ""}
            </p>
            <p className="text-sm text-gray-300">
              {loading
                ? "Chargement des jeux..."
                : `${followedGames.length} jeux dans sa liste`}
            </p>
            <p className="mt-2 text-lg font-semibold text-green-400">
              {user ? `+ ${user.reputation} Rep` : ""}
            </p>
          </div>
          <div className="flex flex-col self-center mt-4 space-y-3 md:mt-0 md:self-start">
            <button className="w-full px-6 py-2 font-semibold text-white transition duration-150 ease-in-out rounded-md md:w-auto whitespace-nowrap [background-color:var(--color-primary)]">
              Modifier le profil
            </button>
            <button
              className="w-full px-6 py-2 font-semibold text-white transition duration-150 ease-in-out rounded-md md:w-auto [background-color:var(--destructive)]"
              onClick={logout}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* Ma Liste Section */}
      <section>
        <div className="flex flex-col items-center justify-between mb-8 sm:flex-row">
          <h2 className="mb-4 text-3xl font-bold font-montserrat sm:mb-0">
            Ma liste
          </h2>
          <div className="flex flex-col items-center w-full gap-4 sm:flex-row sm:w-auto">
            <input
              type="text"
              placeholder="Search for a game..."
              className="w-full px-4 py-2 placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md text-off-white focus:ring-2 focus:border-0 sm:w-64 focus:outline-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md appearance-none text-off-white focus:ring-2 focus:border-0 sm:w-auto focus:outline-primary"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date-desc">Trier par : Date de sortie ↓</option>
              <option value="date-asc">Trier par : Date de sortie ↑</option>
              <option value="name-asc">Trier par : Nom A-Z</option>
              <option value="name-desc">Trier par : Nom Z-A</option>
            </select>
          </div>
        </div>

        {loading && (
          <p className="py-10 text-lg text-center">
            Chargement de votre liste...
          </p>
        )}
        {error && (
          <p className="p-4 py-10 text-lg text-center text-red-400 bg-red-900 rounded-md bg-opacity-30">
            {error}
          </p>
        )}

        {!loading && !error && followedGames.length === 0 && (
          <p className="py-10 text-lg text-center text-gray-400">
            Votre liste de jeux suivis est vide.
          </p>
        )}
        {!loading && !error && filteredAndSortedGames.length === 0 && (
          <p className="py-10 text-lg text-center text-gray-400">
            Aucun jeu ne correspond à la recherche.
          </p>
        )}

        {!loading && !error && filteredAndSortedGames.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredAndSortedGames.map((data) => (
              <ClassicCard
                key={data.followedGame.game.id}
                game={data.followedGame.game}
                isAuthenticated={!!user}
                updatesCount={data.newCount}
              />
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        {!loading && !error && followedGames.length > 0 && (
          <div className="flex items-center justify-center mt-12 space-x-1 sm:space-x-2">
            <button
              className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 sm:text-base"
              disabled
            >
              {"<"}
            </button>
            <button className="px-3 py-1 text-sm text-white rounded-md sm:text-base [background-color:var(--color-primary)]">
              1
            </button>
            <button className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 sm:text-base">
              2
            </button>
            <button className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 sm:text-base">
              3
            </button>
            <span className="px-1 text-gray-400 sm:px-2">...</span>
            <button className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 sm:text-base">
              123
            </button>
            <button className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 sm:text-base">
              {">"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

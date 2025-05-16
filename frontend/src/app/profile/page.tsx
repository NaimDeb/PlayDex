'use client';

import React, { useEffect, useState } from 'react';
import gameService from '@/lib/api/gameService';
import { Game } from '@/types/gameType';

// Placeholder for user data - in a real app, this would come from context or API
const userProfile = {
  avatarUrl: 'https://static.vecteezy.com/system/resources/thumbnails/005/085/940/small_2x/pigeon-profile-avatar-illustration-vector.jpg', // Placeholder pigeon avatar
  username: 'AlphaXenonNebulaShadowRift42',
  contributions: '1 390 745 contributions',
  memberSince: 'Utilisateur depuis le : 12/08/2014',
  gamesInList: '4 565 jeux dans sa liste', // This could be dynamic based on followedGames.length
  rep: '+ 7 777 Rep',
};

export default function ProfilePage() {
  const [followedGames, setFollowedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const games = await gameService.getFollowedGames();
        setFollowedGames(games);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch followed games:', err);
        setError('Impossible de charger votre liste de jeux suivis. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 text-off-white">
      {/* Profile Header Section */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 p-6 bg-gray-800 bg-opacity-70 rounded-lg shadow-xl backdrop-blur-sm">
          <img 
            src={userProfile.avatarUrl} 
            alt="User Avatar" 
            className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-purple-500 object-cover shadow-md"
          />
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl lg:text-4xl font-montserrat font-bold text-purple-400">{userProfile.username}</h1>
            <p className="text-sm text-gray-300 mt-2">{userProfile.contributions}</p>
            <p className="text-sm text-gray-300">{userProfile.memberSince}</p>
            <p className="text-sm text-gray-300">
              {loading ? 'Chargement des jeux...' : `${followedGames.length} jeux dans sa liste`}
            </p>
            <p className="text-lg font-semibold text-green-400 mt-2">{userProfile.rep}</p>
          </div>
          <div className="flex flex-col space-y-3 mt-4 md:mt-0 self-center md:self-start">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out w-full md:w-auto whitespace-nowrap">
              Modifier le profil
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out w-full md:w-auto">
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* Ma Liste Section */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-3xl font-montserrat font-bold mb-4 sm:mb-0">Ma liste</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search for a game..." 
              className="px-4 py-2 rounded-md bg-gray-700 text-off-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border border-gray-600 w-full sm:w-64"
            />
            <select className="px-4 py-2 rounded-md bg-gray-700 text-off-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border border-gray-600 w-full sm:w-auto appearance-none">
              <option value="date-desc">Trier par : Date de sortie ↓</option>
              <option value="date-asc">Trier par : Date de sortie ↑</option>
              <option value="name-asc">Trier par : Nom A-Z</option>
              <option value="name-desc">Trier par : Nom Z-A</option>
              <option value="rating-desc">Trier par : Note ↓</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-center text-lg py-10">Chargement de votre liste...</p>}
        {error && <p className="text-center text-red-400 text-lg py-10 bg-red-900 bg-opacity-30 p-4 rounded-md">{error}</p>}
        
        {!loading && !error && followedGames.length === 0 && (
          <p className="text-center text-gray-400 text-lg py-10">Votre liste de jeux suivis est vide.</p>
        )}

        {!loading && !error && followedGames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {followedGames.map((game) => (
              <ClassicCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        {!loading && !error && followedGames.length > 0 && ( // Only show pagination if there are games and it makes sense (e.g. more than one page)
            <div className="mt-12 flex justify-center items-center space-x-1 sm:space-x-2">
                <button className="px-3 py-1 rounded-md bg-gray-700 hover:bg-purple-600 disabled:opacity-50 text-sm sm:text-base" disabled>{"<"}</button>
                <button className="px-3 py-1 rounded-md bg-purple-600 text-white text-sm sm:text-base">1</button>
                <button className="px-3 py-1 rounded-md bg-gray-700 hover:bg-purple-600 text-sm sm:text-base">2</button>
                <button className="px-3 py-1 rounded-md bg-gray-700 hover:bg-purple-600 text-sm sm:text-base">3</button>
                <span className="text-gray-400 px-1 sm:px-2">...</span>
                <button className="px-3 py-1 rounded-md bg-gray-700 hover:bg-purple-600 text-sm sm:text-base">123</button>
                <button className="px-3 py-1 rounded-md bg-gray-700 hover:bg-purple-600 text-sm sm:text-base">{">"}</button>
            </div>
        )}
      </section>
    </div>
  );
}
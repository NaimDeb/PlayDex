"use client"; // Needed for useState and useEffect

import { useState, useEffect } from "react";
import Image from "next/image"; // Assuming you use next/image
import { Game } from "@/types/gameType";
import gameService from "@/lib/gameService"; // Adjust the import path as needed



export default function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const parts = slug.split('-');
  const id = parts.pop(); // Assumes ID is the last part

  const [gameData, setGameData] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patchnotes, setPatchnotes] = useState([]); // Assuming updates is an array of objects
  const [extensions, setExtensions] = useState([]); // Assuming extensions is an array of objects

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
      } catch (err) {
        setError("Failed to load game data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]); // Re-fetch if id changes

  // --- Filter Logic ---
  const filteredUpdates = gameData?.updates.filter(update => {
    // Add date range filtering here if implemented
    if (update.type === 'update' && !showNews) return false; // Assuming 'update' maps to 'Nouveautés' for now
    if (update.type === 'major' && !showMajor) return false;
    if (update.type === 'minor' && !showMinor) return false;
    if (update.type === 'hotfix' && !showHotfix) return false;
    if (update.type === 'dlc' && !showDlc) return false; // Assuming DLC is also 'Nouveautés'
    return true;
  }) || [];

  // --- Rendering ---
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>;
  }

  if (!gameData) {
    return <div className="container mx-auto px-4 py-8 text-center">Game not found.</div>;
  }

  // Helper to format date difference (replace with a robust library like date-fns if needed)
  const formatDateDifference = (dateStr: string): string => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Math.floor(diffDays / 365);

      if (diffDays <= 1) return "Il y a 1 jour";
      if (diffDays < 365) return `Il y a ${diffDays} jours`;
      if (diffYears === 1) return "Il y a 1 an";
      return `Il y a ${diffYears} ans`;
  }

  return (
    <div className="bg-[#1a1a1a] text-white min-h-screen font-sans"> {/* Assuming font-sans, adjust as needed */}
      <div className="container mx-auto px-4 py-8">

        {/* --- Game Info Section --- */}
        <section className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <Image
              src={gameData.coverImageUrl}
              alt={`${gameData.title} Cover Art`}
              width={300} // Adjust size as needed
              height={450} // Adjust size as needed
              className="rounded-lg object-cover w-full"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-4xl lg:text-5xl font-bold font-montserrat mb-2">{gameData.title}</h1> {/* Assuming font-montserrat */}
            <p className="text-lg text-gray-400 mb-1">{gameData.developer}</p>
            <p className="text-sm text-gray-500 mb-4">Sorti en {new Date(gameData.releaseDate).toLocaleDateString()}</p>
            <div className="flex items-center gap-4 mb-6">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition duration-200">
                Suivi
              </button>
              {/* Add the circle button if needed */}
            </div>
            <p className="text-gray-300 leading-relaxed">{gameData.description}</p>
          </div>
        </section>

        {/* --- Extensions Section --- */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-montserrat">{gameData.extensions.length} Extensions</h2>
            <button className="text-purple-400 hover:text-purple-300">Tout voir</button>
          </div>
          {/* Basic Carousel Placeholder - Replace with a real carousel component */}
          <div className="relative">
             {/* Add Arrow buttons here */}
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {gameData.extensions.map((ext) => (
                <div key={ext.id} className="flex-shrink-0 w-40 bg-[#2a2a2a] rounded p-2 text-center">
                  <Image
                    src={ext.imageUrl}
                    alt={ext.name}
                    width={150}
                    height={200}
                    className="object-cover rounded mb-2 mx-auto"
                  />
                  <p className="text-sm font-semibold">{ext.name}</p>
                  <p className="text-xs text-gray-400">Sortie: {new Date(ext.releaseDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Updates Timeline Section --- */}
        <section>
          <h2 className="text-3xl font-bold font-montserrat mb-6">Dernières mises à jour</h2>

          {/* Filters */}
          <div className="bg-[#2a2a2a] p-4 rounded-lg mb-8 flex flex-wrap gap-4 items-center">
            {/* Add Date Range Pickers Here if needed: Du: Au: */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="filter-news" checked={showNews} onChange={(e) => setShowNews(e.target.checked)} className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
              <label htmlFor="filter-news">Nouveautés</label> {/* Includes updates and dlc for now */}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="filter-major" checked={showMajor} onChange={(e) => setShowMajor(e.target.checked)} className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
              <label htmlFor="filter-major">Majeures</label>
            </div>
             <div className="flex items-center gap-2">
              <input type="checkbox" id="filter-minor" checked={showMinor} onChange={(e) => setShowMinor(e.target.checked)} className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
              <label htmlFor="filter-minor">Mineures</label>
            </div>
             <div className="flex items-center gap-2">
              <input type="checkbox" id="filter-hotfix" checked={showHotfix} onChange={(e) => setShowHotfix(e.target.checked)} className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
              <label htmlFor="filter-hotfix">Hotfixes</label>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-8"> {/* Padding left for the line */}
            {/* The Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>

            {filteredUpdates.length > 0 ? filteredUpdates.map((update, index) => (
              <div key={update.id} className="mb-10 relative">
                {/* Timeline Dot */}
                <div className="absolute left-[-22px] top-1 w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a]"></div>

                {/* Date Column */}
                <div className="absolute left-[-120px] top-0 text-right w-24 text-sm text-gray-400">
                  <div>{new Date(update.date).toLocaleDateString()}</div>
                  <div>{formatDateDifference(update.date)}</div>
                </div>

                {/* Content Column */}
                <div>
                  <h3 className="text-xl font-semibold mb-2 capitalize">{update.type === 'update' ? 'Mise à jour' : update.type}</h3> {/* Simple type display */}
                   <div className="bg-[#2a2a2a] p-4 rounded-lg shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">{update.title}</h4>
                        {/* Add Modifier/Like/Dislike buttons here */}
                         <div className="flex gap-2 items-center">
                            <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Modifier</button>
                            {/* Placeholder icons */}
                            <span className="text-gray-400 cursor-pointer">👍</span>
                            <span className="text-gray-400 cursor-pointer">👎</span>
                         </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3 whitespace-pre-line">{update.description}</p>
                      {update.details && (
                        <ul className="list-disc list-inside text-gray-400 text-sm mb-3">
                          {update.details.map((detail, i) => <li key={i}>{detail}</li>)}
                        </ul>
                      )}
                      <button className="text-purple-400 hover:text-purple-300 text-sm">Voir plus</button>
                   </div>
                </div>
                 {/* Year markers (simplified) - Needs better logic for grouping */}
                 {index > 0 && new Date(update.date).getFullYear() !== new Date(filteredUpdates[index - 1].date).getFullYear() && (
                    <div className="absolute left-[-22px] top-[-40px] w-6 h-6 bg-white rounded-full border-4 border-[#1a1a1a] flex items-center justify-center">
                       {/* Arrow or indicator */}
                    </div>
                 )}
                 {index === 0 && ( /* Add year marker for the first item */
                    <div className="absolute left-[-120px] top-[-40px] text-right w-24 font-bold text-lg">
                        {new Date(update.date).getFullYear()}
                    </div>
                 )}
              </div>
            )) : (
                <p className="text-gray-500">No updates match the current filters.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
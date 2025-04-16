import React from 'react';

// Placeholder Card Component
const GameCardPlaceholder = () => (
  <div className="bg-gray-700 rounded-lg h-64 w-48 flex-shrink-0 m-2 animate-pulse">
    {/* You can add more details here later */}
  </div>
);

export default function Home() {
  return (
    <>
      {/* Hero Section Placeholder - You can add the hero content later */}
      <div className="mb-12 text-center h-64 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Ne rate plus aucun patch !</h1>
        <p className="mb-6">Inscris-toi maintenant.</p>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          S&apos;inscrire
        </button>
        <p className="mt-4 text-sm">
          Déjà un compte ? <a href="#" className="underline">Connectez-vous</a>
        </p>
      </div>

      {/* Pendant mon absence Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Pendant mon absence</h2>
          <a href="#" className="text-sm text-gray-400 hover:underline">Voir toute ma liste</a>
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-2">
          {[...Array(6)].map((_, i) => (
            <GameCardPlaceholder key={`absence-${i}`} />
          ))}
        </div>
      </section>

      {/* Mises à jours populaires Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Mises à jours populaires</h2>
          {/* Optional: Add a link if needed */}
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-2">
          {[...Array(6)].map((_, i) => (
            <GameCardPlaceholder key={`popular-${i}`} />
          ))}
        </div>
      </section>

      {/* Nouveautées Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Nouveautées</h2>
          <a href="#" className="text-sm text-gray-400 hover:underline">Voir toutes les nouveautées</a>
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-2">
          {[...Array(6)].map((_, i) => (
            <GameCardPlaceholder key={`new-${i}`} />
          ))}
        </div>
      </section>
    </>
  );
}
import { Logo } from "@/components/Logo";
import React from "react";

// Placeholder Card Component
const GameCardPlaceholder = () => (
  <div className="bg-gray-700 rounded-lg h-64 w-48 flex-shrink-0 m-2 animate-pulse">
    {/* You can add more details here later */}
  </div>
);

export default function Home() {
  return (
    <>
      <div className='mb-12 h-[40vh] md:h-[30vh] flex items-center max-md:justify-center px-16 justify-between bg-gradient-to-r rounded-lg bg-hero'>
        {/* Left side: Logo */}
        <div className="max-md:hidden">
            <Logo width={192} height={192}/>
        </div>
        {/* Right side: Text content */}
        <div className="flex flex-col items-center justify-center px-12 text-center bg-black/20 p-4">
          <h1 className="text-2xl lg:text-4xl font-bold mb-4 w-full">
            Ne rate plus aucun patch !
            <br/>
            Inscris-toi maintenant.
          </h1>
          <div className="w-full flex justify-center">
            <button className="bg-secondary hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
              S&apos;inscrire
            </button>
          </div>
          <p className="mt-4 text-sm w-full">
            Déjà un compte ?{" "}
            <a href="#" className="underline">
              Connectez-vous
            </a>
          </p>
        </div>
      </div>

      {/* Pendant mon absence Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Pendant mon absence</h2>
          <a href="#" className="text-sm text-gray-400 hover:underline">
            Voir toute ma liste
          </a>
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
          <a href="#" className="text-sm text-gray-400 hover:underline">
            Voir toutes les nouveautées
          </a>
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

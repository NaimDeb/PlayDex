import React from "react";
import Image from "next/image";
import { GenreTag } from "@/components/GenreTag";
import { FollowButton } from "@/components/FollowButton";
import { Game } from "@/types/gameType";

interface GameInfoSectionProps {
  gameData: Game;
  image: string;
  isAuthenticated: boolean;
}

export const GameInfoSection: React.FC<GameInfoSectionProps> = ({
  gameData,
  image,
  isAuthenticated,
}) => {
  return (
    <section className="flex flex-col md:flex-row gap-8 mb-12 mt-4">
      <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
        <Image
          src={image}
          alt={`${gameData.title} Cover Art`}
          width={300}
          height={450}
          className="rounded-lg object-cover w-full"
        />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h1
            className="text-4xl lg:text-5xl font-bold mb-2"
            aria-label={`Game title: ${gameData.title}`}
          >
            {gameData.title}
          </h1>
          {isAuthenticated && <FollowButton gameId={gameData.id} />}
        </div>
        <div
          className="flex gap-3 text-off-white text-nowrap flex-wrap font-semibold"
          aria-label="List of companies involved in the game"
        >
          {gameData.companies.map((company, index) => (
            <p
              key={`${company.name}-${index}`}
              className="text-xl hover:text-gray-300 hover:underline cursor-pointer mb-1"
            >
              <a href="#" aria-label={`View details about ${company.name}`}>
                {company.name}
              </a>
              {index < gameData.companies.length - 1 && ", "}
            </p>
          ))}
        </div>
        <p className="text-md text-gray-500 mb-4">
          Sorti en {new Date(gameData.releasedAt).toLocaleDateString()}
        </p>
        <div className="flex gap-3 flex-wrap mb-4">
          {gameData.genres.map((genre, index) => (
            <GenreTag key={`${genre.name}-${index}`} genre={genre.name} />
          ))}
        </div>
        <p className="text-gray-300 leading-relaxed">{gameData.description}</p>
      </div>
    </section>
  );
};

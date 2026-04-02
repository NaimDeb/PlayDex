"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { GenreTag } from "@/components/GenreTag";
import { FollowButton } from "@/components/FollowButton";
import { ExtensionCard } from "@/components/ArticleCard/ExtensionCard";
import { Game, Extension } from "@/types/gameType";
import { useTranslation } from "@/i18n/TranslationProvider";

interface GameInfoSectionProps {
  gameData: Game;
  extensions: Extension[];
  image: string;
  isAuthenticated: boolean;
}

export const GameInfoSection: React.FC<GameInfoSectionProps> = ({
  gameData,
  extensions,
  image,
  isAuthenticated,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  const ExtensionsList = () => (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" ref={scrollRef}>
      {extensions.map((ext) => (
        <ExtensionCard
          key={ext.id}
          id={ext.id}
          title={ext.title}
          imageUrl={ext.imageUrl}
          releasedAt={ext.releasedAt}
        />
      ))}
    </div>
  );

  return (
    <section className="flex flex-col md:flex-row gap-8 mb-12 mt-4">
      {/* Cover */}
      <figure className="flex-shrink-0 w-full md:w-[240px] lg:w-[280px] m-0">
        <Image
          src={image}
          alt={`Couverture de ${gameData.title}`}
          width={280}
          height={420}
          className="rounded-lg object-cover w-full"
          priority
        />
      </figure>

      {/* Info */}
      <div className="flex flex-col flex-grow min-w-0">

        {/* Title + follow */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            {gameData.title}
          </h1>
          {isAuthenticated && (
            <div className="flex-shrink-0 mt-1">
              <FollowButton gameId={gameData.id} />
            </div>
          )}
        </div>

        {/* Companies */}
        <div className="flex flex-wrap gap-1 mb-1">
          {gameData.companies.map((company, i) => (
            <span key={`${company.name}-${i}`}>
              <a
                href={`/search?companyName=${encodeURIComponent(company.name)}`}
                className="text-lg font-semibold text-off-white hover:text-gray-300 hover:underline"
              >
                {company.name}
              </a>
              {i < gameData.companies.length - 1 && (
                <span className="text-gray-500">,&nbsp;</span>
              )}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {t("game.releasedIn", { date: new Date(gameData.releasedAt).toLocaleDateString("fr-FR") })}
        </p>

        {/* Genres */}
        <ul className="flex flex-wrap gap-2 mb-4 list-none p-0" aria-label="Genres">
          {gameData.genres.map((genre, i) => (
            <li key={`${genre.name}-${i}`}>
              <GenreTag genre={genre.name} />
            </li>
          ))}
        </ul>

        {/* Description */}
        <p className="text-gray-300 leading-relaxed mb-6">
          {gameData.description}
        </p>

        {/* Extensions — desktop, dans la colonne info */}
        {extensions.length > 0 && (
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">
                {extensions.length} {extensions.length > 1 ? t("game.extensionCountPlural") : t("game.extensionCount")}
              </h2>
              {extensions.length > 5 && (
                <button className="text-sm text-gray-400 hover:underline">
                  {t("game.seeAll")}
                </button>
              )}
            </div>

            <div className="relative group/carousel">
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                  w-7 h-7 rounded-full bg-black/70 border border-white/20
                  flex items-center justify-center
                  opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                aria-label={t("common.previous")}
              >
                ‹
              </button>

              <ExtensionsList />

              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                  w-7 h-7 rounded-full bg-black/70 border border-white/20
                  flex items-center justify-center
                  opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                aria-label={t("common.next")}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extensions — mobile, sous le cover */}
      {extensions.length > 0 && (
        <div className="md:hidden">
          <h2 className="text-xl font-bold mb-3">
            {extensions.length} {extensions.length > 1 ? t("game.extensionCountPlural") : t("game.extensionCount")}
          </h2>
          <ExtensionsList />
        </div>
      )}
    </section>
  );
};
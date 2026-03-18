import { Game } from "@/types/gameType";
import { FollowButton } from "../FollowButton";
import Image from "next/image";
import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DESCRIPTION_MAX_LENGTH = 200;
const COVER_WIDTH = 150;
const COVER_HEIGHT = 214;

// ─── Component ───────────────────────────────────────────────────────────────

interface SearchResultCardProps {
  game: Game;
}

export function SearchResultCard({
  game,
}: SearchResultCardProps): React.ReactElement {
  const formattedDate: string = game.releasedAt
    ? new Date(game.releasedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

  const truncatedDescription: string = game.description
    ? game.description.length > DESCRIPTION_MAX_LENGTH
      ? `${game.description.slice(0, DESCRIPTION_MAX_LENGTH)}...`
      : game.description
    : "";

  const coverUrl: string = game.imageUrl
    ? changeIgdbImageFormat(game.imageUrl, IgdbImageFormat.CoverBig)
    : "/no_cover.png";

  return (
    <a
      href={`/article/${game.id}`}
      className="
        flex w-full rounded-lg overflow-hidden
        bg-off-gray/45
        hover:ring-2 hover:ring-primary
        transition-all duration-200
        no-underline
      "
    >
      {/* ── Cover image ──
          bg-off-gray sur le conteneur évite le fond "cassé"
          si l'image est transparente ou en cours de chargement.
      */}
      <div
        className="flex-shrink-0 bg-off-gray/45"
        style={{ width: COVER_WIDTH, minHeight: COVER_HEIGHT }}
      >
        <Image
          src={coverUrl}
          alt={game.title}
          width={COVER_WIDTH}
          height={COVER_HEIGHT}
          className="object-cover"
          style={{ width: COVER_WIDTH, height: "100%", minHeight: COVER_HEIGHT, display: "block" }}
        />
      </div>

      {/* ── Text content ── */}
      <div className="flex flex-grow items-start gap-4 px-5 py-4 min-w-0">
        {/* Left : titre + date + description */}
        <div className="flex flex-col flex-grow min-w-0">
          <h3 className="text-2xl font-bold text-off-white leading-tight">
            {game.title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Sortie : {formattedDate}
          </p>
          {truncatedDescription && (
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              {truncatedDescription}
            </p>
          )}
        </div>

        {/* Right : follow button centré verticalement */}
        <div
          className="flex-shrink-0 self-center"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
        >
          <FollowButton gameId={game.id} size="md" />
        </div>
      </div>
    </a>
  );
}
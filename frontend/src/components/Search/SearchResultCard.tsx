import { Game } from "@/types/gameType";
import { FollowButton } from "../FollowButton";
import Image from "next/image";
import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";

export function SearchResultCard({ game } : { game: Game}) {
    return (
      <a
        href={`/article/${game.id}`}
        className="flex w-full bg-off-gray rounded-lg overflow-hidden shadow space-x-4 relative hover:ring-2 hover:ring-primary transition"
        style={{ textDecoration: "none" }}
      >
        <Image
          src={
        game.imageUrl
          ? changeIgdbImageFormat(game.imageUrl, IgdbImageFormat.CoverBig)
          : "/no_cover.png"
          }
          alt={game.title}
          width={120}
          height={180}
          className="w-32 h-44 object-cover rounded-l flex-shrink-0"
        />
        <div className="flex flex-col justify-between flex-grow p-4">
          <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-white">{game.title}</h3>
          <p className="text-sm text-gray-400 mb-2">Sortie : {game.releasedAt}</p>
        </div>
        <div className="ml-2">
          <FollowButton gameId={game.id} />
        </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
        {game.description
          ? game.description.length > 100
            ? `${game.description.slice(0, 100)}...`
            : game.description
          : ""}
          </p>
        </div>
      </a>
    )
}
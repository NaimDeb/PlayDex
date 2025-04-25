import { Game } from "@/types/gameType";
import { FollowButton } from "../FollowButton";
import Image from "next/image";

export function SearchResultCard({ game } : { game: Game}) {
    return (
        <div className="space-y-4">
        <Image
          src={game.imageUrl}
          alt={game.title}
          width={100}
          height={150}
          className="w-24 h-36 object-cover rounded flex-shrink-0"
        />
        <div className="text-white flex-grow">
          <h3 className="text-2xl font-bold">{game.title}</h3>
          <p className="text-sm text-gray-400 mb-2">Sortie : {game.releasedAt}</p>
          <p className="text-gray-300 text-sm mb-4">
            {game.description.length > 100 ? `${game.description.slice(0, 100)}...` : game.description}
          </p>
        </div>
        <FollowButton
          gameId={game.id}
        />
      </div>
    )
}
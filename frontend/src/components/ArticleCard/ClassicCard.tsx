import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "../FollowButton";
import { Game } from "@/types/gameType";

type ClassicCardProps = {
  game: Game;
  isDlc?: boolean;
  updatesCount?: number;
  isAuthenticated?: boolean;
  isFollowed?: boolean | null;
};

export function ClassicCard({
  game,
  isDlc = false,
  updatesCount = 0,
  isAuthenticated = false,
}: ClassicCardProps) {
  const { id, title, imageUrl, releasedAt } = game;
  const coverUrl = changeIgdbImageFormat(
    imageUrl ?? "",
    IgdbImageFormat.CoverBig
  );

  return (
    <Link href={`/article/${id}`} className="group">
      <div
        className={`
          relative flex-shrink-0 w-60 h-90 bg-[#2a2a2a] rounded-sm overflow-hidden
          hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer
          ${isDlc ? "border-4 border-purple-500" : ""}
        `}
        style={{ width: "15rem", height: "22.5rem" }} // 50% bigger than 10rem x 15rem
      >
        {/* DLC Triangle */}
        {isDlc && (
          <div className="absolute top-0 left-0 z-10">
            <div className="w-0 h-0 border-l-[56px] border-l-transparent border-b-[56px] border-b-purple-600 relative">
              <span
                className="absolute top-0 left-0 text-xs font-bold text-white"
                style={{ transform: "rotate(-45deg) translate(5px, 10px)" }}
              >
                DLC
              </span>
            </div>
          </div>
        )}

        {/* Top-right: Updates Badge and Follow Button */}
        <div className="absolute z-10 flex flex-col items-end space-y-1 top-2 right-2">
          {/* Updates Badge */}
          {updatesCount > 0 && (
            <span className="px-2 py-1 font-bold text-black bg-yellow-400 rounded-full shadow text-md">
              {updatesCount > 99 ? "99+" : updatesCount} updates
            </span>
          )}
          {/* Follow Button */}
          {isAuthenticated && <FollowButton gameId={id} />}
        </div>

        <Image
          src={coverUrl || "/no_cover.png"}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute text-white bottom-4 left-4 right-4">
          <p className="text-xl font-semibold">{title}</p>
          <p className="text-gray-300 text-md">
            Sortie: {new Date(releasedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

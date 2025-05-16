import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "../FollowButton";
import { Game } from "@/types/gameType";
// Update the import path below if the actual location is different
// import { FollowButton } from "../ui/FollowButton";

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
          relative flex-shrink-0 w-60 h-90 bg-[#2a2a2a] rounded-xl overflow-hidden
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
                className="absolute left-0 top-0 text-xs font-bold text-white"
                style={{ transform: "rotate(-45deg) translate(5px, 10px)" }}
              >
                DLC
              </span>
            </div>
          </div>
        )}

        {/* Top-right elements: Updates Badge and Follow Button */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-1">
          {/* Updates Badge */}
          {updatesCount > 0 && (
            <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow">
              {updatesCount > 99 ? "99+" : updatesCount} updates
            </span>
          )}
          {/* Follow Button */}
          {isAuthenticated && (
            <FollowButton gameId={id} />
          )}
        </div>

        <Image
          src={coverUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-gray-300">
            Sortie: {new Date(releasedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}

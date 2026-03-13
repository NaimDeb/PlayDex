import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "../FollowButton";
import { UpdatesBadge } from "./UpdatesBadge";
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
  const coverUrl = changeIgdbImageFormat(imageUrl ?? "", IgdbImageFormat.CoverBig);

  return (
    <Link href={`/article/${id}`} className="group">
      <div
        className={`
          relative flex-shrink-0 bg-[#2a2a2a] rounded overflow-hidden cursor-pointer
          ${isDlc ? "outline outline-[3px] outline-fuchsia-600" : ""}
        `}
        style={{ width: "200px", height: "300px" }}
      >
        {/* DLC corner triangle */}
        {isDlc && (
          <div className="absolute top-0 left-0 z-10 w-14 h-14 overflow-hidden">
            <div
              className="absolute top-0 left-0 w-0 h-0"
              style={{
                borderStyle: "solid",
                borderWidth: "56px 56px 0 0",
                borderColor: "#c026d3 transparent transparent transparent",
              }}
            />
            <span
              className="absolute text-white font-extrabold"
              style={{
                fontSize: "10px",
                top: "9px",
                left: "3px",
                transform: "rotate(-45deg)",
                letterSpacing: "0.04em",
              }}
            >
              DLC
            </span>
          </div>
        )}

        {/* Top-right: badge + follow — hors du scale */}
        <div className="absolute z-10 flex flex-col items-end gap-1.5 top-2 right-2">
          <UpdatesBadge count={updatesCount ?? 0} />
          {isAuthenticated && <FollowButton gameId={id} />}
        </div>

        {/* Cover image */}
        <Image
          src={coverUrl || "/no_cover.png"}
          alt={title}
          fill
          style={{ objectFit: "cover" }}
          className="absolute inset-0 transition-transform duration-200 ease-in-out group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Title + date */}
        <div className="absolute bottom-3 left-3 right-3 text-white z-10">
          <p className="text-md font-bold leading-tight truncate">{title}</p>
          <p className="text-gray-400 text-xs mt-1">
            sortie : {new Date(releasedAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    </Link>
  );
}
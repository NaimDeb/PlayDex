import { changeIgdbImageFormat, IgdbImageFormat } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "../FollowButton";
import { UpdatesBadge } from "./UpdatesBadge";
import { Game } from "@/types/gameType";

type MobileCardProps = {
  game: Game;
  updatesCount?: number;
  isAuthenticated?: boolean;
  isFollowed?: boolean | null;
};

export function MobileCard({
  game,
  updatesCount = 0,
  isAuthenticated = false,
}: MobileCardProps) {
  const { id, title, imageUrl, releasedAt } = game;
  const coverUrl = changeIgdbImageFormat(imageUrl ?? "", IgdbImageFormat.CoverBig);

  return (
    <Link href={`/article/${id}`} className="group lg:hidden">
      <div
        className="relative flex-shrink-0 bg-[#2a2a2a] rounded overflow-hidden cursor-pointer
          hover:scale-105 transition-transform duration-200 ease-in-out"
        style={{ width: "155px", height: "232px" }}
      >
        {/* Top-right: badge + follow */}
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
          className="absolute inset-0"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Title + date */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
          <p className="text-xs font-bold leading-tight truncate">{title}</p>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: "10px" }}>
            sortie : {new Date(releasedAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    </Link>
  );
}

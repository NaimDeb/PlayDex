import userService from "@/lib/api/userService";
import { useState } from "react";
import { useFollowedGames } from "@/providers/FollowedGamesProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";

type FollowButtonProps = {
  gameId: number;
};

export function FollowButton({ gameId }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const { refreshFollowedGames, followedGameIds } = useFollowedGames();
  const { showMessage } = useFlashMessage();

  const isFollowing = followedGameIds.includes(String(gameId));

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (!isFollowing) {
        await userService.followGame(gameId);
        showMessage("Jeu suivi !", "success");
      } else {
        await userService.unfollowGame(gameId);
        showMessage("Jeu retiré !", "info");
      }
      await refreshFollowedGames();
    } catch (error) {
      console.error("Error:", error);
      showMessage("Une erreur est survenue. Veuillez réessayer.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleFollow(); }}
        disabled={loading}
        className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-full
          bg-[#2a2a2a] border border-gray-500
          text-white text-xs font-semibold
          hover:border-red-400 hover:text-red-300 transition-colors duration-150
          disabled:opacity-50"
      >
        Suivi
        {/* Cercle ⊖ */}
        <span className="w-[18px] h-[18px] rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-300 font-bold leading-none" style={{ fontSize: "11px" }}>−</span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleFollow(); }}
      disabled={loading}
      className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-full
        bg-white border border-gray-300
        text-gray-900 text-xs font-semibold
        hover:bg-gray-100 transition-colors duration-150
        disabled:opacity-50"
    >
      Suivre
      {/* Cercle ⊕ */}
      <span className="w-[18px] h-[18px] rounded-full border border-gray-500 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-700 font-bold leading-none" style={{ fontSize: "11px" }}>+</span>
      </span>
    </button>
  );
}
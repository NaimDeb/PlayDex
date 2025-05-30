import userService from "@/lib/api/userService";
import { useState } from "react";
import { FaMinusCircle, FaPlusCircle } from "react-icons/fa";
import { useFollowedGames } from "@/providers/FollowedGamesProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";

type FollowButtonProps = {
  gameId: number;
};

export function FollowButton({ gameId }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const { refreshFollowedGames, followedGameIds } = useFollowedGames();
  const { showMessage } = useFlashMessage();

  // console.log("FollowButton - followedGameIds:", followedGameIds);

  let isFollowingState = followedGameIds.includes(String(gameId));

  // console.log("FollowButton - isFollowingState:", isFollowingState);

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (!isFollowingState) {
        await userService.followGame(gameId);
        isFollowingState = true;
        showMessage("Jeu suivi !", "success");
      } else {
        await userService.unfollowGame(gameId);
        isFollowingState = false;
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

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleFollow();
      }}
      disabled={loading}
      tabIndex={0}
      className={`flex items-center justify-center max-md:text-3xl text-off-white font-bold py-2 px-2 md:px-4 rounded-md transition-colors duration-150 ease-in-out border-2 border-gray-500/50 max-md:fixed max-md:right-5 max-md:bottom-5 ${
        loading
          ? "bg-off-gray cursor-not-allowed"
          : "bg-off-gray hover:bg-gray-600"
      }`}
    >
      {loading ? (
        "Loading..."
      ) : isFollowingState ? (
        <>
          <span className="mr-2">Suivi</span>
          <FaMinusCircle />
        </>
      ) : (
        <>
          <span className="mr-2">Suivre</span>
          <FaPlusCircle />
        </>
      )}
    </button>
  );
}

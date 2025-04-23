import userService from "@/lib/api/userService";
import { useState } from "react";
import { FaMinusCircle, FaPlusCircle } from "react-icons/fa";
import { useFollowedGames } from "@/providers/FollowedGamesProvider";

type FollowButtonProps = {
    gameId: number;
  };
  
  export function FollowButton({ gameId }: FollowButtonProps) {
    const [loading, setLoading] = useState(false);
    const { refreshFollowedGames, followedGameIds } = useFollowedGames();

    // console.log("FollowButton - followedGameIds:", followedGameIds);
    

    let isFollowingState = followedGameIds.includes(String(gameId));

    // console.log("FollowButton - isFollowingState:", isFollowingState);

    
    const handleFollow = async () => {    
        setLoading(true);
        try {
            if (!isFollowingState) {
                await userService.followGame(gameId);
                isFollowingState = true;
                alert("Game followed successfully!"); // Flash message for success
            } else {
                await userService.unfollowGame(gameId);
                isFollowingState = false;
                alert("Game unfollowed successfully!"); // Flash message for success
            }
            await refreshFollowedGames();
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again."); // Flash message for error
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <button
        onClick={handleFollow}
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
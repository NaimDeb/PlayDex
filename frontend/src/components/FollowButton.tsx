"use client";

import userService from "@/lib/api/userService";
import { useState } from "react";
import { useFollowedGames } from "@/providers/FollowedGamesProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FollowButtonSize = "sm" | "md";

type FollowButtonProps = {
  gameId: number;
  size?: FollowButtonSize;
};

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE_STYLES: Record<FollowButtonSize, {
  button: string;
  text: string;
  circle: string;
  iconSize: string;
}> = {
  sm: {
    button: "pl-3 pr-2 py-1",
    text: "text-xs",
    circle: "w-[16px] h-[16px]",
    iconSize: "10px",
  },
  md: {
    button: "pl-5 pr-3 py-2",
    text: "text-sm",
    circle: "w-[20px] h-[20px]",
    iconSize: "12px",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FollowButton({
  gameId,
  size = "sm",
}: FollowButtonProps): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const { refreshFollowedGames, followedGameIds } = useFollowedGames();
  const { showMessage } = useFlashMessage();

  const isFollowing: boolean = followedGameIds.includes(String(gameId));
  const s = SIZE_STYLES[size];

  const handleFollow = async (): Promise<void> => {
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    e.preventDefault();
    void handleFollow();
  };

  const icon = isFollowing ? "−" : "+";
  const label = isFollowing ? "Suivi" : "Suivre";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        flex items-center gap-2 ${s.button} rounded-md
        bg-off-black border border-gray-600
        text-off-white ${s.text} font-semibold
        hover:border-red-400 hover:text-red-300
        transition-colors duration-150 disabled:opacity-50
      `}
    >
      {label}
      <span
        className={`
          ${s.circle} rounded-full
          border border-gray-400
          flex items-center justify-center flex-shrink-0
        `}
      >
        <span
          className="text-gray-300 font-bold leading-none"
          style={{ fontSize: s.iconSize }}
        >
          {icon}
        </span>
      </span>
    </button>
  );
}
import { ClassicCard } from "./ClassicCard";
import { Game } from "@/types/gameType";

type DLCCardProps = {
  game: Game;
  updatesCount?: number;
  isAuthenticated?: boolean;
  isFollowed?: boolean | null;
};

export function DLCCard({ game, updatesCount, isAuthenticated, isFollowed }: DLCCardProps) {
  return (
    <ClassicCard
      game={game}
      isDlc={true}
      updatesCount={updatesCount}
      isAuthenticated={isAuthenticated}
      isFollowed={isFollowed}
    />
  );
}

import { ClassicCard } from "./ClassicCard";
import { Game } from "@/types/gameType";

type LoggedInCardProps = {
  game: Game;
  isDlc?: boolean;
  updatesCount?: number;
  isFollowed?: boolean | null;
};

export function LoggedInCard({ game, isDlc, updatesCount, isFollowed }: LoggedInCardProps) {
  return (
    <ClassicCard
      game={game}
      isDlc={isDlc}
      updatesCount={updatesCount}
      isAuthenticated={true}
      isFollowed={isFollowed}
    />
  );
}

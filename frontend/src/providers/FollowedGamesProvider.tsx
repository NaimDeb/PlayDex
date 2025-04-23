"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import userService from "@/lib/api/userService";
import { useAuth } from "./AuthProvider";

type FollowedGamesContextType = {
  followedGameIds: string[];
  refreshFollowedGames: () => Promise<void>;
};

const FollowedGamesContext = createContext<FollowedGamesContextType>({
  followedGameIds: [],
  refreshFollowedGames: async () => {},
});

export const useFollowedGames = () => useContext(FollowedGamesContext);

export const FollowedGamesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [followedGameIds, setFollowedGameIds] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();


  const refreshFollowedGames = React.useCallback(async () => {
    if (!isAuthenticated) {
        setFollowedGameIds([]);        
        return;
      }
    const games = await userService.getFollowedGames();
    // console.log("games from API:", games);


    const gameIds = (games.map((g: { game: { id: string } }) => g.game.id));
    // console.log("Followed games:", gameIds);
    
    setFollowedGameIds(gameIds.map(String));    

  }, [isAuthenticated]);


  useEffect(() => {
    refreshFollowedGames();
    if (!isAuthenticated) setFollowedGameIds([]);
  }, [isAuthenticated, refreshFollowedGames]);

  return (
    <FollowedGamesContext.Provider value={{ followedGameIds, refreshFollowedGames }}>
      {children}
    </FollowedGamesContext.Provider>
  );
};
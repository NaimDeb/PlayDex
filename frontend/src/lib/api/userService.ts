import { User } from "@/types/authType";
import apiClient from "./apiClient";
import authUtils from "../authUtils";

class UserService {
  /**
   * Calls the POST endpoint /games/followed-games/{gameId} to follow a game.
   * @param gameId
   * @returns
   */
  async followGame(gameId: number) {
    const config = authUtils.getAuthorization();

    try {
      const response = await apiClient.post(
        `/followed-games/${gameId}`,
        {},
        config
      );
      return response;
    } catch (error) {
      console.error("Error following game:", error);
      throw error;
    }
  }

  /**
   * Calls the DELETE endpoint /games/followed-games/{gameId} to unfollow a game.
   * @param gameId
   * @returns
   */
  async unfollowGame(gameId: number) {
    const config = authUtils.getAuthorization();

    try {
      const response = await apiClient.delete(
        `/followed-games/${gameId}`,
        config
      );
      return response;
    } catch (error) {
      console.error("Error unfollowing game:", error);
      throw error;
    }
  }

  /**
   * Calls the GET endpoint /games/followed-games to get the list of followed games.
   * @returns
   */
  async getFollowedGames() {
    const config = authUtils.getAuthorization();

    try {
      const response = await apiClient.get("/followed-games", config);
      return response.data.member;
    } catch (error) {
      console.error("Error fetching followed games:", error);
      throw error;
    }
  }

  /**
   * Calls the PATCH endpoint /users/{id} to update the user profile.
   * @param data - Partial<User> - The user data to update. This should be a partial object of the User type.
   * @returns
   */
  async patchUserProfile(data: Partial<User>) {
    const config = authUtils.getAuthorization();

    // Override content type for PATCH requests to use merge-patch+json
    const patchConfig = {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "application/merge-patch+json",
      },
    };

    try {
      const response = await apiClient.patch(
        `/users/${data.id}`,
        data,
        patchConfig
      );
      return response;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  async getUserById(id: number) {
    // Appel public sans header d'authentification
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;

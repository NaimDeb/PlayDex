import { Extension, Game, GameFilters } from '@/types/gameType';
import apiClient from './apiClient';
import { Modification, Patchnote } from '@/types/patchNoteType';
import authUtils from '../authUtils';

class GameService {


    async getGames(filters: GameFilters = {}): Promise<{ member: Game[]; totalItems: number; }> {
        const params = new URLSearchParams();
    
        
        // Iterate over each filter key-value pair
        Object.entries(filters).forEach(([key, value]) => {
            // Skip if the value is undefined or null
            if (value === undefined || value === null) return;
            // If the value is an array, append each item separately
            if (Array.isArray(value)) {
            value.forEach(val => params.append(key, val));
            } else {
            // Otherwise, append the value as a string
            params.append(key, value.toString());
            }
        });
    
        const response = await apiClient.get(`/games?${params.toString()}`);
        return response.data;
    }

    async getExtensions(filters: GameFilters = {}): Promise<{ member: Game[]; totalItems: number; }> {
        const params = new URLSearchParams();
    
        
        // Iterate over each filter key-value pair
        Object.entries(filters).forEach(([key, value]) => {
            // Skip if the value is undefined or null
            if (value === undefined || value === null) return;
            // If the value is an array, append each item separately
            if (Array.isArray(value)) {
            value.forEach(val => params.append(key, val));
            } else {
            // Otherwise, append the value as a string
            params.append(key, value.toString());
            }
        });
    
        const response = await apiClient.get(`/games?${params.toString()}`);
        return response.data;
    }

    async getGenres(): Promise<Array<{ id: string; name: string }>> {
        const response = await apiClient.get('/genres');
        return response.data.member;
    }



    async getGameById(id: string): Promise<Game> {
        const response = await apiClient.get(`/games/${id}`);
        return response.data;
    }

    async getGameExtensions(id: string): Promise<Array<Extension>> {
        const response = await apiClient.get(`/games/${id}/extensions`);
        return response.data.member;
    }

    async getGamePatchNotes(id: string): Promise<Array<Patchnote>> {
        const response = await apiClient.get(`/games/${id}/patchnotes`);
        return response.data.member;
    }

    async getPatchNoteById(id: string): Promise<Patchnote> {
        const response = await apiClient.get(`/patchnotes/${id}`);
        return response.data;
    }

    async patchPatchnote(id: string, patchnoteData: Partial<Patchnote>): Promise<Patchnote> {
        const config = {
            ...authUtils.getAuthorization(),
            headers: {
                ...(authUtils.getAuthorization().headers || {}),
                'Content-Type': 'application/merge-patch+json',
            },
        };

        const response = await apiClient.patch(`/patchnotes/${id}`, patchnoteData, config);
        return response.data;
    }

    async postPatchnote(patchnoteData: Partial<Patchnote>): Promise<Patchnote> {
        const config = authUtils.getAuthorization();

        const response = await apiClient.post(`/patchnotes`, patchnoteData, config);

        return response.data;
    }

    async getModificationsByPatchnoteId(id: string, page: number): Promise<Array<Modification>> {
        const config = authUtils.getAuthorization();
        const response = await apiClient.get(`/modifications?page=${page}&patchnote.id=${id}`, config);

        return response.data.member;
    }

    async getModificationById(id: string): Promise<Modification> {
        const response = await apiClient.get(`/modifications/${id}`);
        return response.data;
    }

    async getFollowedGames(): Promise<Array<Game>> {
        const config = authUtils.getAuthorization();
        const response = await apiClient.get('/followed-games', config);
        return response.data.member;
    }

    // Should be /games/latest endpoint but it gives me a 404 error for some reason
    async getLatestGames(): Promise<Array<Game>> {
        const response = await apiClient.get('/games?sort=-createdAt');
        return response.data.member;
    }

    async getLatestReleases(): Promise<Array<Game>> {
        const response = await apiClient.get('/latest-releases');
        return response.data.member;
    }

    async getAbsenceGames(): Promise<Array<Game>> {
        const config = authUtils.getAuthorization();
        const response = await apiClient.get('/followed-games/absence', config);
        return response.data.member;
    }

    async postCheckGame(id: string): Promise<Game> {
        const config = authUtils.getAuthorization();
        const response = await apiClient.post(`/followed-games/${id}/check`, {}, config);
        return response.data;
    }


}

const gameService = new GameService();
export default gameService;
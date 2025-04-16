import { Extension, Game } from '@/types/gameType';
import apiClient from './apiClient';
import { Patchnote } from '@/types/patchNoteType';

class GameService {


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
        const response = await apiClient.get(`/api/patchnotes/${id}`);
        return response.data;
    }

    async patchPatchnote(id: string, patchnoteData: Partial<Patchnote>): Promise<Patchnote> {
        const response = await apiClient.patch(`/api/patchnotes/${id}`, patchnoteData);
        return response.data;
    }

    async postPatchnote(patchnoteData: Partial<Patchnote>): Promise<Patchnote> {
        const response = await apiClient.post(`/api/patchnotes`, patchnoteData);
        return response.data;
    }

}

const gameService = new GameService();
export default gameService;
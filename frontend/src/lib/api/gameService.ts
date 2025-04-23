import { Extension, Game } from '@/types/gameType';
import apiClient from './apiClient';
import { Modification, Patchnote } from '@/types/patchNoteType';
import authUtils from '../authUtils';

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
    

}



const gameService = new GameService();
export default gameService;
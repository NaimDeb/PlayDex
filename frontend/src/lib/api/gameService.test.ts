import { describe, it, expect, vi, beforeEach } from 'vitest';
import gameService from './gameService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../authUtils', () => ({
  default: {
    getAuthorization: () => ({
      headers: { Authorization: 'Bearer testtoken' },
    }),
  },
}));

describe('GameService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getGames builds filter query params correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [], totalItems: 0 },
    });

    await gameService.getGames({ page: 1 } as any);

    const url = vi.mocked(apiClient.get).mock.calls[0][0];
    expect(url).toContain('/games?');
    expect(url).toContain('page=1');
  });

  it('getGames handles array filter values', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [], totalItems: 0 },
    });

    await gameService.getGames({ 'genres.name[]': ['Action', 'RPG'] } as any);

    const url = vi.mocked(apiClient.get).mock.calls[0][0];
    expect(url).toContain('genres.name%5B%5D=Action');
    expect(url).toContain('genres.name%5B%5D=RPG');
  });

  it('getGameById calls correct endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 42, title: 'Test Game' },
    });

    const result = await gameService.getGameById('42');

    expect(apiClient.get).toHaveBeenCalledWith('/games/42');
    expect(result.title).toBe('Test Game');
  });

  it('patchPatchnote sends merge-patch+json content type', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { id: 1, title: 'Updated' },
    });

    await gameService.patchPatchnote('1', { title: 'Updated' } as any);

    const config = vi.mocked(apiClient.patch).mock.calls[0][2];
    expect(config?.headers?.['Content-Type']).toBe('application/merge-patch+json');
  });

  it('postPatchnote sends authorization header', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 1, title: 'New' },
    });

    await gameService.postPatchnote({ title: 'New' } as any);

    const config = vi.mocked(apiClient.post).mock.calls[0][2];
    expect(config?.headers?.Authorization).toBe('Bearer testtoken');
  });

  it('deletePatchnote calls correct endpoint with auth', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });

    await gameService.deletePatchnote(5);

    expect(apiClient.delete).toHaveBeenCalledWith('/patchnotes/5', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }),
    }));
  });
});

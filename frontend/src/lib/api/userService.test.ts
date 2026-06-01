import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from './userService';
import apiClient from './apiClient';
import type { User } from '@/types/authType';

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

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('followGame calls POST /followed-games/{id}', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    await userService.followGame(42);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/followed-games/42',
      {},
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });

  it('unfollowGame calls DELETE /followed-games/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });

    await userService.unfollowGame(42);

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/followed-games/42',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });

  it('getFollowedGames returns member array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [{ id: 1, game: { id: 10 } }] },
    });

    const result = await userService.getFollowedGames();

    expect(result).toEqual([{ id: 1, game: { id: 10 } }]);
  });

  it('patchUserProfile sends merge-patch+json', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });

    await userService.patchUserProfile({ id: 1, username: 'newname' } as Partial<User>);

    const config = vi.mocked(apiClient.patch).mock.calls[0][2];
    expect(config?.headers?.['Content-Type']).toBe('application/merge-patch+json');
  });

  it('deleteAccount calls DELETE /users/{id}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });

    await userService.deleteAccount(5);

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/users/5',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });
});

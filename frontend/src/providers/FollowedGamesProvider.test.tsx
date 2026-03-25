import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { FollowedGamesProvider, useFollowedGames } from './FollowedGamesProvider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock authService (needed by AuthProvider)
const mockMe = vi.fn();
vi.mock('@/lib/api/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: () => mockMe(),
  },
}));

// Mock userService
const mockGetFollowedGames = vi.fn();
vi.mock('@/lib/api/userService', () => ({
  default: {
    getFollowedGames: () => mockGetFollowedGames(),
  },
}));

// We need AuthProvider as parent
import { AuthProvider } from './AuthProvider';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FollowedGamesProvider>{children}</FollowedGamesProvider>
    </AuthProvider>
  );
}

describe('FollowedGamesProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockRejectedValue(new Error('Not authenticated'));
    mockGetFollowedGames.mockResolvedValue([]);
  });

  it('returns empty array when not authenticated', async () => {
    const { result } = renderHook(() => useFollowedGames(), { wrapper });

    await waitFor(() => {
      expect(result.current.followedGameIds).toEqual([]);
    });
  });

  it('fetches and sets followed game IDs when authenticated', async () => {
    mockMe.mockResolvedValue({ id: 1, email: 'test@test.com', username: 'user', roles: ['ROLE_USER'] });
    mockGetFollowedGames.mockResolvedValue([
      { game: { id: 1 } },
      { game: { id: 2 } },
    ]);

    const { result } = renderHook(() => useFollowedGames(), { wrapper });

    await waitFor(() => {
      expect(result.current.followedGameIds).toEqual(['1', '2']);
    });
  });

  it('provides a refreshFollowedGames function', async () => {
    const { result } = renderHook(() => useFollowedGames(), { wrapper });

    await waitFor(() => {
      expect(typeof result.current.refreshFollowedGames).toBe('function');
    });
  });
});

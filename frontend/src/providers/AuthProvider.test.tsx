import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthProvider';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock authService
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockMe = vi.fn();

vi.mock('@/lib/api/authService', () => ({
  default: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    logout: () => mockLogout(),
    me: () => mockMe(),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockRejectedValue(new Error('Not authenticated'));
  });

  it('initializes in unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it('login sets user and isAuthenticated on success', async () => {
    const user = { id: 1, email: 'test@test.com', username: 'testuser', roles: ['ROLE_USER'] };
    mockLogin.mockResolvedValue({ user, token: 'abc' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('login sets error on failure', async () => {
    mockLogin.mockRejectedValue({ message: 'Invalid credentials' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'bad@test.com', password: 'wrong' });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('register redirects to login on success', async () => {
    mockRegister.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({ email: 'new@test.com', password: 'Abcdef1!', username: 'newuser' });
    });

    expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
  });

  it('logout clears state and redirects', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('useAuth throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  });
});

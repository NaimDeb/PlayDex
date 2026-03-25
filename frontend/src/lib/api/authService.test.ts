import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './authService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; max-age=0; path=/`;
    });
  });

  it('login calls /login_check and sets cookie', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { token: 'jwt_token_123' },
    });
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 1, email: 'test@test.com', username: 'user' },
    });

    // Set cookie so me() can read it
    document.cookie = 'auth_token=jwt_token_123; path=/';

    const result = await authService.login({ email: 'test@test.com', password: 'pass' });

    expect(apiClient.post).toHaveBeenCalledWith('/login_check', {
      email: 'test@test.com',
      password: 'pass',
    });
    expect(result.token).toBe('jwt_token_123');
    expect(result.user).toBeDefined();
  });

  it('register calls /register with correct data', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    await authService.register({ email: 'new@test.com', password: 'Pass1!', username: 'newuser' });

    expect(apiClient.post).toHaveBeenCalledWith('/register', {
      email: 'new@test.com',
      plainPassword: 'Pass1!',
      username: 'newuser',
    });
  });

  it('me calls /me with Bearer token', async () => {
    document.cookie = 'auth_token=mytoken123; path=/';
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 1, email: 'test@test.com' },
    });

    const user = await authService.me();

    expect(apiClient.get).toHaveBeenCalledWith('/me', {
      headers: { Authorization: 'Bearer mytoken123' },
    });
    expect(user.email).toBe('test@test.com');
  });

  it('me throws when no token in cookies', async () => {
    await expect(authService.me()).rejects.toThrow('No token found in cookie');
  });

  it('logout removes auth_token cookie', async () => {
    document.cookie = 'auth_token=test; path=/';

    // Mock window.location.href setter
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '/', set href(v: string) { hrefSetter(v); } },
      writable: true,
    });

    await authService.logout();

    // Cookie should be cleared
    expect(document.cookie).not.toContain('auth_token=test');
  });
});

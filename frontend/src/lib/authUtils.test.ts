import { describe, it, expect, beforeEach } from 'vitest';
import authUtils from './authUtils';

describe('authUtils', () => {
  beforeEach(() => {
    // Clear all cookies
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; max-age=0`;
    });
  });

  it('returns Bearer token from cookie', () => {
    document.cookie = 'auth_token=mytoken123';
    const result = authUtils.getAuthorization();
    expect(result).toEqual({
      headers: { Authorization: 'Bearer mytoken123' },
    });
  });

  it('throws when no auth_token cookie exists', () => {
    expect(() => authUtils.getAuthorization()).toThrow(
      'No token found in cookies, try to log in first'
    );
  });
});

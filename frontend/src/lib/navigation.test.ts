import { describe, it, expect, vi } from 'vitest';
import {
  navigateToSearch,
  navigateToRandomGame,
  updateSearchParams,
  sanitizeRedirectPath,
  loginHref,
} from './navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

function createMockRouter(): AppRouterInstance {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
}

describe('sanitizeRedirectPath', () => {
  it('keeps internal paths', () => {
    expect(sanitizeRedirectPath('/article/42')).toBe('/article/42');
    expect(sanitizeRedirectPath('/search?q=doom')).toBe('/search?q=doom');
  });

  it('falls back to home when there is no path', () => {
    expect(sanitizeRedirectPath(null)).toBe('/');
    expect(sanitizeRedirectPath(undefined)).toBe('/');
    expect(sanitizeRedirectPath('')).toBe('/');
  });

  it('rejects off-site targets', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/');
    expect(sanitizeRedirectPath('//evil.com')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/');
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
  });
});

describe('loginHref', () => {
  it('carries the current page as redirect target', () => {
    expect(loginHref('/article/42')).toBe('/login?redirect=%2Farticle%2F42');
  });

  it('omits the redirect for home and auth pages', () => {
    expect(loginHref('/')).toBe('/login');
    expect(loginHref('/login')).toBe('/login');
    expect(loginHref('/register')).toBe('/login');
    expect(loginHref(null)).toBe('/login');
  });

  it('omits the redirect for off-site targets', () => {
    expect(loginHref('https://evil.com')).toBe('/login');
  });
});

describe('navigateToSearch', () => {
  it('builds correct URL with category and query', () => {
    const router = createMockRouter();

    navigateToSearch(router, 'jeux', 'minecraft');

    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('/search?')
    );
    const url = (router.push as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('category=jeux');
    expect(url).toContain('q=minecraft');
  });
});

describe('navigateToRandomGame', () => {
  it('navigates to a random game article page', () => {
    const router = createMockRouter();

    navigateToRandomGame(router, null, 100);

    // Should have called either push or refresh
    const pushCalled = (router.push as ReturnType<typeof vi.fn>).mock.calls.length > 0;
    const refreshCalled = (router.refresh as ReturnType<typeof vi.fn>).mock.calls.length > 0;
    expect(pushCalled || refreshCalled).toBe(true);
  });
});

describe('updateSearchParams', () => {
  it('replaces history by default', () => {
    const router = createMockRouter();

    updateSearchParams(router, '/search', { page: '2', sort: 'date' });

    expect(router.replace).toHaveBeenCalledWith(
      expect.stringContaining('/search?')
    );
    const url = (router.replace as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('sort=date');
  });

  it('pushes when replaceHistory is false', () => {
    const router = createMockRouter();

    updateSearchParams(router, '/search', { page: '3' }, false);

    expect(router.push).toHaveBeenCalledWith(expect.stringContaining('/search?page=3'));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

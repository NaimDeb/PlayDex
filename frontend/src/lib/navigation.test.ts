import { describe, it, expect, vi } from 'vitest';
import { navigateToSearch, navigateToRandomGame, updateSearchParams } from './navigation';
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

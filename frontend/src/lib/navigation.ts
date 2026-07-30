/**
 * Navigation utility functions using Next.js router
 * These replace window.location anti-patterns with proper Next.js navigation
 * @module lib/navigation
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/** Where users land after login when no valid return path is known. */
export const DEFAULT_REDIRECT_PATH = '/';

/**
 * Validates a post-login return path.
 * Only same-origin paths are accepted: anything else (absolute URL,
 * protocol-relative "//evil.com", …) would let a crafted link bounce a freshly
 * authenticated user off-site.
 * @param path - Candidate path, typically read from a `redirect` query param
 * @returns The path if it is a safe internal one, otherwise DEFAULT_REDIRECT_PATH
 * @example
 * sanitizeRedirectPath('/article/42')       // "/article/42"
 * sanitizeRedirectPath('//evil.com')        // "/"
 * sanitizeRedirectPath('https://evil.com')  // "/"
 */
export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return DEFAULT_REDIRECT_PATH;
  if (!path.startsWith('/') || path.startsWith('//')) return DEFAULT_REDIRECT_PATH;
  // "/\evil.com" est traité comme protocol-relative par certains navigateurs.
  if (path.startsWith('/\\')) return DEFAULT_REDIRECT_PATH;

  return path;
}

/**
 * Builds the login URL carrying the page to come back to after signing in
 * @param currentPath - Path the user is currently on (usually from usePathname())
 * @returns "/login" with a `redirect` param, or plain "/login" when there is
 * nothing meaningful to come back to (home, or the auth pages themselves)
 * @example
 * loginHref('/article/42') // "/login?redirect=%2Farticle%2F42"
 */
export function loginHref(currentPath: string | null | undefined): string {
  const target = sanitizeRedirectPath(currentPath);
  if (target === DEFAULT_REDIRECT_PATH || target.startsWith('/login') || target.startsWith('/register')) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(target)}`;
}

/**
 * Navigates to the search page with specified category and query
 * @param router - Next.js App Router instance from useRouter()
 * @param category - Search category (jeux, extensions, genre, entreprise)
 * @param query - Search query string
 * @example
 * const router = useRouter();
 * navigateToSearch(router, 'jeux', 'minecraft');
 */
export function navigateToSearch(
  router: AppRouterInstance,
  category: string,
  query: string
): void {
  const params = new URLSearchParams({
    category,
    q: query,
  });
  router.push(`/search?${params.toString()}`);
}

/**
 * Navigates to a random game article page
 * If the random ID matches the current game, refreshes the page instead
 * @param router - Next.js App Router instance from useRouter()
 * @param currentGameId - Current game ID to avoid duplicate navigation
 * @param maxGameId - Maximum game ID for random selection
 * @example
 * const router = useRouter();
 * const pathname = usePathname();
 * const currentId = pathname.split("/article/")[1] || null;
 * navigateToRandomGame(router, currentId, MAX_GAME_ID);
 */
export function navigateToRandomGame(
  router: AppRouterInstance,
  currentGameId: string | null,
  maxGameId: number
): void {
  const randomGameId = Math.floor(Math.random() * maxGameId) + 1;

  // If we randomly selected the current game, just refresh the page
  if (randomGameId === parseInt(currentGameId || "0")) {
    router.refresh();
    return;
  }

  router.push(`/article/${randomGameId}`);
}

/**
 * Updates URL search parameters without full page navigation
 * Useful for filter and pagination state management
 * @param router - Next.js App Router instance from useRouter()
 * @param pathname - Current pathname from usePathname()
 * @param params - Object of search parameters to set
 * @param replaceHistory - If true, replaces history instead of pushing (default: true)
 * @example
 * updateSearchParams(router, '/search', { page: '2', sort: 'date' });
 * // Navigates to: /search?page=2&sort=date
 */
export function updateSearchParams(
  router: AppRouterInstance,
  pathname: string,
  params: Record<string, string>,
  replaceHistory: boolean = true
): void {
  const searchParams = new URLSearchParams(params);
  const url = `${pathname}?${searchParams.toString()}`;

  if (replaceHistory) {
    router.replace(url);
  } else {
    router.push(url);
  }
}

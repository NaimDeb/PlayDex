/**
 * Navigation utility functions using Next.js router
 * These replace window.location anti-patterns with proper Next.js navigation
 * @module lib/navigation
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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

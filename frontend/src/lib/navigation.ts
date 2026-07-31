import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const DEFAULT_REDIRECT_PATH = '/';

/**
 * Rejects anything that is not an internal path: a crafted link would bounce a
 * freshly authenticated user off-site.
 */
export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return DEFAULT_REDIRECT_PATH;
  if (!path.startsWith('/') || path.startsWith('//')) return DEFAULT_REDIRECT_PATH;
  // Some browsers treat "/\evil.com" as protocol-relative.
  if (path.startsWith('/\\')) return DEFAULT_REDIRECT_PATH;

  return path;
}

/** No `redirect` param when there is nothing to come back to: home or the auth pages. */
export function loginHref(currentPath: string | null | undefined): string {
  const target = sanitizeRedirectPath(currentPath);
  if (target === DEFAULT_REDIRECT_PATH || target.startsWith('/login') || target.startsWith('/register')) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(target)}`;
}

/** @param category - one of: jeux, extensions, genre, entreprise */
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

/** Replaces history by default: filter and pagination steps should not stack up in the back button. */
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

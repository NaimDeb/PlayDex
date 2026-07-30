/**
 * Cache court terme réservé aux données publiques : sessionStorage n'étant pas
 * vidé à la déconnexion, rien de lié à un utilisateur ne doit y passer.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const STORAGE_PREFIX = "playdex-cache:";

const memoryCache = new Map<string, CacheEntry<unknown>>();

function readFromStorage<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    // Quota dépassé, mode privé, JSON corrompu.
    return null;
  }
}

function writeToStorage<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Best effort : le cache reste un bonus, jamais un blocage.
  }
}

/** Renvoie null si l'entrée est absente ou expirée. */
export function readCache<T>(key: string): T | null {
  const entry = (memoryCache.get(key) as CacheEntry<T> | undefined) ?? readFromStorage<T>(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    invalidateCache(key);
    return null;
  }

  // Remonte l'entrée en mémoire pour éviter un JSON.parse aux lectures suivantes.
  memoryCache.set(key, entry);
  return entry.value;
}

/** @param value - doit être sérialisable en JSON */
export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  memoryCache.set(key, entry);
  writeToStorage(key, entry);
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Best effort : le cache reste un bonus, jamais un blocage.
  }
}

/**
 * Cache court terme pour les données publiques de l'API.
 *
 * Les listes de la page d'accueil (nouveautés, dernières patchnotes) sont
 * identiques pour tous les visiteurs et changent au rythme du poller Steam :
 * les re-télécharger à chaque retour sur la page ne sert à rien.
 *
 * Deux niveaux :
 * - une Map en mémoire, qui survit aux navigations côté client ;
 * - sessionStorage, qui survit en plus à un rechargement de l'onglet.
 *
 * À réserver aux données publiques : rien de lié à un utilisateur ne doit y
 * passer, sessionStorage n'étant pas vidé à la déconnexion.
 *
 * @module lib/api/responseCache
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
    // Quota, mode privé, JSON corrompu : le cache reste un bonus, jamais un blocage.
    return null;
  }
}

function writeToStorage<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Idem : on ignore silencieusement une écriture impossible.
  }
}

/**
 * Lit une valeur encore valide du cache.
 * @param key - Clé de cache
 * @returns La valeur si elle est présente et non expirée, sinon null
 */
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

/**
 * Met une valeur en cache pour une durée donnée.
 * @param key - Clé de cache
 * @param value - Valeur à mémoriser (doit être sérialisable en JSON)
 * @param ttlMs - Durée de validité en millisecondes
 */
export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  memoryCache.set(key, entry);
  writeToStorage(key, entry);
}

/**
 * Supprime une entrée du cache (mémoire et sessionStorage).
 * @param key - Clé de cache
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Voir readFromStorage.
  }
}

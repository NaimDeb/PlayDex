import { useEffect, useRef, useCallback } from "react";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEBOUNCE_MS = 500;

interface CachedFormData<T> {
  data: T;
  savedAt: number;
}

/**
 * Persists form state to localStorage with debounce + 10-minute TTL.
 * Returns `loadCachedForm` to restore data on mount, and auto-saves on changes.
 */
export function useFormCache<T>(cacheKey: string, form: T) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save form changes with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const entry: CachedFormData<T> = { data: form, savedAt: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cacheKey, form]);

  // Load cached form data (returns null if expired or missing)
  const loadCachedForm = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;

      const entry: CachedFormData<T> = JSON.parse(raw);
      if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }, [cacheKey]);

  // Clear cache (e.g. after successful submit)
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return { loadCachedForm, clearCache };
}

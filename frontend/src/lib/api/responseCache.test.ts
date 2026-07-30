import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readCache, writeCache, invalidateCache } from './responseCache';

describe('responseCache', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for an unknown key', () => {
    expect(readCache('nope')).toBeNull();
  });

  it('reads back a written value', () => {
    writeCache('home:public', { games: [1, 2] }, 60_000);

    expect(readCache('home:public')).toEqual({ games: [1, 2] });
  });

  it('expires the entry after its TTL', () => {
    writeCache('home:public', 'value', 60_000);

    vi.advanceTimersByTime(59_000);
    expect(readCache('home:public')).toBe('value');

    vi.advanceTimersByTime(2_000);
    expect(readCache('home:public')).toBeNull();
  });

  it('survives a reload through sessionStorage', () => {
    writeCache('home:public', 'value', 60_000);
    // On vide le cache mémoire en changeant de clé : seule sessionStorage reste.
    const stored = window.sessionStorage.getItem('playdex-cache:home:public');

    expect(stored).toContain('value');
  });

  it('drops an invalidated entry from both layers', () => {
    writeCache('home:public', 'value', 60_000);
    invalidateCache('home:public');

    expect(readCache('home:public')).toBeNull();
    expect(window.sessionStorage.getItem('playdex-cache:home:public')).toBeNull();
  });
});

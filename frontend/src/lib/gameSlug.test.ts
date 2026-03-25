import { describe, it, expect } from 'vitest';
import { getIdFromSlug } from './gameSlug';

describe('getIdFromSlug', () => {
  it('returns the last part of a slug as ID', () => {
    expect(getIdFromSlug('game-name-123')).toBe('123');
  });

  it('returns ID for slug with no hyphens', () => {
    expect(getIdFromSlug('456')).toBe('456');
  });

  it('handles slugs with multiple hyphens', () => {
    expect(getIdFromSlug('my-great-game-789')).toBe('789');
  });

  it('throws for non-numeric ID', () => {
    expect(() => getIdFromSlug('game-name-abc')).toThrow('Invalid ID in slug');
  });
});

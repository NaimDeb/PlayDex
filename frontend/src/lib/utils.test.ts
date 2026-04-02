import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatDateDifference,
  generatePagination,
  changeIgdbImageFormat,
  IgdbImageFormat,
  colorizeContent,
} from './utils';

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('returns empty string when all values are falsy', () => {
    expect(cn(false, undefined)).toBe('');
  });

  it('handles single class', () => {
    expect(cn('only')).toBe('only');
  });
});

describe('formatDateDifference', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Il y a quelques secondes" for less than a minute ago', () => {
    const date = new Date('2026-03-25T11:59:30Z');
    expect(formatDateDifference(date)).toBe('Il y a quelques secondes');
  });

  it('returns singular minute', () => {
    const date = new Date('2026-03-25T11:59:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 1 minute');
  });

  it('returns plural minutes', () => {
    const date = new Date('2026-03-25T11:45:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 15 minutes');
  });

  it('returns singular hour', () => {
    const date = new Date('2026-03-25T11:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 1 heure');
  });

  it('returns plural hours', () => {
    const date = new Date('2026-03-25T07:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 5 heures');
  });

  it('returns "Il y a 1 jour" for one day ago', () => {
    const date = new Date('2026-03-24T12:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 1 jour');
  });

  it('returns plural days', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 10 jours');
  });

  it('returns "Il y a 1 an" for one year ago', () => {
    const date = new Date('2025-03-25T12:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 1 an');
  });

  it('returns plural years', () => {
    const date = new Date('2023-03-25T12:00:00Z');
    expect(formatDateDifference(date)).toBe('Il y a 3 ans');
  });

  it('accepts a string date', () => {
    expect(formatDateDifference('2026-03-25T11:59:30Z')).toBe('Il y a quelques secondes');
  });
});

describe('generatePagination', () => {
  it('returns all pages when total <= 7', () => {
    expect(generatePagination(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns all pages for exactly 7', () => {
    expect(generatePagination(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns first pages with ellipsis when current <= 3', () => {
    expect(generatePagination(2, 10)).toEqual([1, 2, 3, '...', 9, 10]);
  });

  it('returns last pages with ellipsis when current >= total-2', () => {
    expect(generatePagination(9, 10)).toEqual([1, 2, '...', 8, 9, 10]);
  });

  it('returns middle pages with double ellipsis', () => {
    expect(generatePagination(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });

  it('handles single page', () => {
    expect(generatePagination(1, 1)).toEqual([1]);
  });
});

describe('changeIgdbImageFormat', () => {
  it('replaces thumbnail format in URL', () => {
    const url = 'https://images.igdb.com/igdb/image/upload/t_thumb/abc.jpg';
    expect(changeIgdbImageFormat(url, IgdbImageFormat.CoverBig)).toBe(
      'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg'
    );
  });

  it('returns same string when no thumbnail format found', () => {
    const url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg';
    expect(changeIgdbImageFormat(url, IgdbImageFormat.CoverBig)).toBe(url);
  });

  it('returns empty string for empty input', () => {
    expect(changeIgdbImageFormat('', IgdbImageFormat.CoverBig)).toBe('');
  });
});

describe('colorizeContent', () => {
  it('replaces [buff] tags with span elements', () => {
    expect(colorizeContent('[buff]increased[/buff]')).toBe(
      '<span class="buff">increased</span>'
    );
  });

  it('replaces [debuff] tags with span elements', () => {
    expect(colorizeContent('[debuff]decreased[/debuff]')).toBe(
      '<span class="debuff">decreased</span>'
    );
  });

  it('handles multiple tags', () => {
    const input = 'Damage [buff]up[/buff] and speed [debuff]down[/debuff]';
    const expected = 'Damage <span class="buff">up</span> and speed <span class="debuff">down</span>';
    expect(colorizeContent(input)).toBe(expected);
  });

  it('leaves text without tags unchanged', () => {
    expect(colorizeContent('no tags here')).toBe('no tags here');
  });
});

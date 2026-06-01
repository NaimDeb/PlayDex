import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormCache } from './useFormCache';

describe('useFormCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loadCachedForm returns cached data within TTL', () => {
    const data = { name: 'test' };
    const entry = { data, savedAt: Date.now() };
    localStorage.setItem('test-key', JSON.stringify(entry));

    const { result } = renderHook(() => useFormCache('test-key', {}));

    const loaded = result.current.loadCachedForm();
    expect(loaded).toEqual(data);
  });

  it('loadCachedForm returns null for expired data', () => {
    const data = { name: 'old' };
    const entry = { data, savedAt: Date.now() - 11 * 60 * 1000 }; // 11 minutes ago
    localStorage.setItem('test-key', JSON.stringify(entry));

    const { result } = renderHook(() => useFormCache('test-key', {}));

    const loaded = result.current.loadCachedForm();
    expect(loaded).toBeNull();
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('loadCachedForm returns null for missing data', () => {
    const { result } = renderHook(() => useFormCache('missing-key', {}));

    const loaded = result.current.loadCachedForm();
    expect(loaded).toBeNull();
  });

  it('loadCachedForm returns null for invalid JSON', () => {
    localStorage.setItem('bad-key', 'not json');

    const { result } = renderHook(() => useFormCache('bad-key', {}));

    const loaded = result.current.loadCachedForm();
    expect(loaded).toBeNull();
  });

  it('clearCache removes item from localStorage', () => {
    localStorage.setItem('clear-key', JSON.stringify({ data: {}, savedAt: Date.now() }));

    const { result } = renderHook(() => useFormCache('clear-key', {}));

    act(() => {
      result.current.clearCache();
    });

    expect(localStorage.getItem('clear-key')).toBeNull();
  });

  it('auto-saves form data after debounce', () => {
    const formData = { title: 'My Form' };

    renderHook(() => useFormCache('auto-key', formData));

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const stored = localStorage.getItem('auto-key');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.data).toEqual(formData);
  });
});

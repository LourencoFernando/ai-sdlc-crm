import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme, useTheme, writeTheme } from './theme-state';

function blockStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
}

describe('theme state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('is light when nothing is saved', () => {
    expect(readTheme()).toBe('light');
  });

  it('reads a saved dark mode, and treats anything else as light', () => {
    writeTheme('dark');
    expect(readTheme()).toBe('dark');
    localStorage.setItem('accountable.theme', 'purple');
    expect(readTheme()).toBe('light');
  });

  it('sets the mode on the html element', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    applyTheme('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('starts from the saved mode, and switching applies and saves it', () => {
    writeTheme('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('dark');

    act(() => result.current[1]());
    expect(result.current[0]).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(readTheme()).toBe('light');

    act(() => result.current[1]());
    expect(result.current[0]).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(readTheme()).toBe('dark');
  });

  it('is light when storage throws, and the switch still works', () => {
    blockStorage();
    expect(readTheme()).toBe('light');
    expect(() => writeTheme('dark')).not.toThrow();

    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('light');
    act(() => result.current[1]());
    expect(result.current[0]).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});

import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

/** The inline script in index.html reads this same key before the first paint, so keep the two in step. */
const KEY = 'accountable.theme';

/** Light or dark, remembered per browser. Storage can be missing or throw; then the mode is light and isn't remembered. */
export function readTheme(): Theme {
  try {
    return window.localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // Not remembered, but the switch still works for this visit.
  }
}

/** The tokens in tokens.css switch on this attribute, and portals inherit it because it sits on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState(readTheme);
  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      writeTheme(next);
      return next;
    });
  }, []);
  return [theme, toggle];
}

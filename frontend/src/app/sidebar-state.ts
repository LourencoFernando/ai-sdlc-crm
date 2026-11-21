import { useCallback, useState } from 'react';

const KEY = 'accountable.sidebar';

/** Collapsed or not, remembered per browser. Storage can be missing or throw; then it just isn't remembered. */
export function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export function writeCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(KEY, collapsed ? 'collapsed' : 'expanded');
  } catch {
    // Not remembered, but the sidebar still works.
  }
}

export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      writeCollapsed(!c);
      return !c;
    });
  }, []);
  return [collapsed, toggle];
}

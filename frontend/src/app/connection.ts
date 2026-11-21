import { useSyncExternalStore } from 'react';

/** Whether the backend has stopped answering (G9). Any screen can read it; the query cache sets it. */
let unreachable = false;
const listeners = new Set<() => void>();

export function setUnreachable(value: boolean): void {
  if (value === unreachable) return;
  unreachable = value;
  listeners.forEach((l) => l());
}

export function useUnreachable(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => unreachable,
  );
}

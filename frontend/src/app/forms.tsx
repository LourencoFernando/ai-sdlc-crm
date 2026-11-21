import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Opens the record forms from anywhere (the sidebar's New deal, a column's Add deal, record pages). */
export interface FormsApi {
  openDeal: (defaults?: Record<string, unknown>) => void;
}

const FormsContext = createContext<FormsApi>({ openDeal: () => {} });

export function FormsProvider({ children }: { children: ReactNode }) {
  const [, setOpen] = useState<null | { kind: string }>(null);
  const api = useMemo<FormsApi>(() => ({ openDeal: () => setOpen({ kind: 'deal' }) }), []);
  return <FormsContext.Provider value={api}>{children}</FormsContext.Provider>;
}

export function useForms(): FormsApi {
  return useContext(FormsContext);
}

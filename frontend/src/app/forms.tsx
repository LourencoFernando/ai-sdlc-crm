import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Activity, Contact, Deal, Organization } from '../api/types';
import { OrganizationForm } from '../features/organizations/OrganizationForm';
import { ContactForm, type ContactDefaults } from '../features/contacts/ContactForm';
import { DealForm, type DealDefaults } from '../features/deals/DealForm';
import { ActivityForm, type ActivityTarget } from '../features/activities/ActivityForm';
import { DeleteDialog, type DeleteRequest } from '../features/deleting';
import { useMeta } from '../lib/hooks';

type Open =
  | { kind: 'organization'; record?: Organization }
  | { kind: 'contact'; record?: Contact; defaults?: ContactDefaults }
  | { kind: 'deal'; record?: Deal; defaults?: DealDefaults }
  | { kind: 'activity'; record?: Activity; target?: ActivityTarget }
  | { kind: 'delete'; request: DeleteRequest };

/** Opens the record forms and delete dialogs from anywhere: the sidebar, tables, record pages, the board. */
export interface FormsApi {
  openOrganization: (record?: Organization) => void;
  openContact: (record?: Contact, defaults?: ContactDefaults) => void;
  openDeal: (record?: Deal, defaults?: DealDefaults) => void;
  openActivity: (options: { record?: Activity; target?: ActivityTarget }) => void;
  confirmDelete: (request: DeleteRequest) => void;
}

const noop = () => {};
const FormsContext = createContext<FormsApi>({
  openOrganization: noop,
  openContact: noop,
  openDeal: noop,
  openActivity: noop,
  confirmDelete: noop,
});

export function FormsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  // Forms fill in stage probabilities, so wait for /api/meta before showing one.
  const { data: meta } = useMeta();
  const api = useMemo<FormsApi>(
    () => ({
      openOrganization: (record) => setOpen({ kind: 'organization', record }),
      openContact: (record, defaults) => setOpen({ kind: 'contact', record, defaults }),
      openDeal: (record, defaults) => setOpen({ kind: 'deal', record, defaults }),
      openActivity: ({ record, target }) => setOpen({ kind: 'activity', record, target }),
      confirmDelete: (request) => setOpen({ kind: 'delete', request }),
    }),
    [],
  );
  const close = () => setOpen(null);

  return (
    <FormsContext.Provider value={api}>
      {children}
      {meta && open?.kind === 'organization' && <OrganizationForm record={open.record} onClose={close} />}
      {meta && open?.kind === 'contact' && <ContactForm record={open.record} defaults={open.defaults} onClose={close} />}
      {meta && open?.kind === 'deal' && <DealForm record={open.record} defaults={open.defaults} onClose={close} />}
      {meta && open?.kind === 'activity' && <ActivityForm record={open.record} target={open.target} onClose={close} />}
      {open?.kind === 'delete' && <DeleteDialog request={open.request} onClose={close} />}
    </FormsContext.Provider>
  );
}

export function useForms(): FormsApi {
  return useContext(FormsContext);
}

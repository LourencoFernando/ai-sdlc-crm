/**
 * How records are shaped in responses, shared by the services so a deal or an
 * activity looks the same wherever it appears.
 */

export const contactSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  jobTitle: true,
  status: true,
  organizationId: true,
} as const;

export function toContactSummary<T extends { firstName: string; lastName: string }>(c: T) {
  return { ...c, name: `${c.firstName} ${c.lastName}` };
}

export const dealListInclude = {
  organization: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
} as const;

export function toDealView<
  T extends { contact: { id: number; firstName: string; lastName: string } | null },
>(d: T) {
  return {
    ...d,
    contact: d.contact ? { id: d.contact.id, name: `${d.contact.firstName} ${d.contact.lastName}` } : null,
  };
}

export const activityInclude = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, name: true } },
} as const;

export function toActivityView<
  T extends {
    contact: { id: number; firstName: string; lastName: string } | null;
    deal: { id: number; name: string } | null;
  },
>(a: T) {
  return {
    ...a,
    contact: a.contact ? { id: a.contact.id, name: `${a.contact.firstName} ${a.contact.lastName}` } : null,
    deal: a.deal ? { id: a.deal.id, name: a.deal.name } : null,
  };
}

/** Newest first by date, then by time created (A3). */
export const timelineOrder = [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }] as const;

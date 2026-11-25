/**
 * What a delete keeps, unlinks or deletes (X1–X5). The preview shows these, and the
 * delete carries them out, so the two can never disagree.
 */

export function organizationDeleteEffect(input: { deals: { id: number; name: string }[]; contactIds: number[] }): {
  blocked: boolean;
  blockingDeals: { id: number; name: string }[];
  contactsToUnlink: number[];
} {
  return { blocked: input.deals.length > 0, blockingDeals: input.deals, contactsToUnlink: input.contactIds };
}

/** An activity also related to a deal is kept, related only to the deal (X5). */
export function contactDeleteEffect(input: {
  activities: { id: number; dealId: number | null }[];
  dealIdsAsMainContact: number[];
}): { activitiesToDelete: number[]; activitiesToKeep: number[]; dealsToUnlink: number[] } {
  return {
    activitiesToDelete: input.activities.filter((a) => a.dealId === null).map((a) => a.id),
    activitiesToKeep: input.activities.filter((a) => a.dealId !== null).map((a) => a.id),
    dealsToUnlink: input.dealIdsAsMainContact,
  };
}

/** An activity also related to a contact is kept, related only to the contact (X5). */
export function dealDeleteEffect(input: { activities: { id: number; contactId: number | null }[] }): {
  activitiesToDelete: number[];
  activitiesToKeep: number[];
} {
  return {
    activitiesToDelete: input.activities.filter((a) => a.contactId === null).map((a) => a.id),
    activitiesToKeep: input.activities.filter((a) => a.contactId !== null).map((a) => a.id),
  };
}

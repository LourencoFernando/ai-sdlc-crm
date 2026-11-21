import { contactDeleteEffect, dealDeleteEffect, organizationDeleteEffect } from './delete-effects';

describe('deleting an organization (X1, X2)', () => {
  it('is blocked while it has deals, and lists them', () => {
    const e = organizationDeleteEffect({ deals: [{ id: 1, name: 'Fleet telematics' }], contactIds: [5] });
    expect(e).toEqual({ blocked: true, blockingDeals: [{ id: 1, name: 'Fleet telematics' }], contactsToUnlink: [5] });
  });

  it('unlinks its contacts when it has no deals', () => {
    expect(organizationDeleteEffect({ deals: [], contactIds: [5, 6] })).toEqual({
      blocked: false, blockingDeals: [], contactsToUnlink: [5, 6],
    });
  });
});

describe('deleting a contact (X3, X5)', () => {
  it('deletes its own activities, keeps those also on a deal, and unlinks its deals', () => {
    const e = contactDeleteEffect({
      activities: [{ id: 1, dealId: null }, { id: 2, dealId: 9 }, { id: 3, dealId: null }],
      dealIdsAsMainContact: [9, 10],
    });
    expect(e).toEqual({ activitiesToDelete: [1, 3], activitiesToKeep: [2], dealsToUnlink: [9, 10] });
  });
});

describe('deleting a deal (X4, X5)', () => {
  it('deletes its activities and stage changes, and keeps those also on a contact', () => {
    const e = dealDeleteEffect({
      activities: [
        { id: 1, contactId: null },
        { id: 2, contactId: 4 },
        { id: 3, contactId: null },
      ],
    });
    expect(e).toEqual({ activitiesToDelete: [1, 3], activitiesToKeep: [2] });
  });
});

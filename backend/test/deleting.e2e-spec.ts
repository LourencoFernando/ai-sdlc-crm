import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

describe('deleting (X1–X5)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeEach(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterEach(() => t.close());

  it('refuses to delete an organization with deals, and its preview lists them (X1)', async () => {
    const org = await a.org();
    const d = await a.deal(org.id, { name: 'Fleet telematics' });
    const preview = await a.http().get(`/api/organizations/${org.id}/delete-preview`).expect(200);
    expect(preview.body).toMatchObject({ blocked: true, deals: [{ id: d.id, name: 'Fleet telematics' }] });
    const res = await a.http().delete(`/api/organizations/${org.id}`).expect(409);
    expect(res.body.deals).toEqual([{ id: d.id, name: 'Fleet telematics' }]);
    await a.http().get(`/api/organizations/${org.id}`).expect(200);
  });

  it('unlinks the contacts of an organization with no deals (X2)', async () => {
    const org = await a.org();
    const c1 = await a.contact({ firstName: 'One', lastName: 'A', organizationId: org.id });
    await a.contact({ firstName: 'Two', lastName: 'B', organizationId: org.id });
    const preview = await a.http().get(`/api/organizations/${org.id}/delete-preview`).expect(200);
    expect(preview.body).toEqual({ blocked: false, deals: [], contactsToUnlink: 2 });
    await a.http().delete(`/api/organizations/${org.id}`).expect(204);
    await a.http().get(`/api/organizations/${org.id}`).expect(404);
    const kept = await a.http().get(`/api/contacts/${c1.id}`).expect(200);
    expect(kept.body.organizationId).toBeNull();
  });

  it('deletes a contact with its activities and unlinks its deals, giving both counts (X3)', async () => {
    const org = await a.org();
    const c = await a.contact({ organizationId: org.id });
    const d = await a.deal(org.id, { contactId: c.id });
    await a.activity({ contactId: c.id, description: 'Own note 1' });
    await a.activity({ contactId: c.id, description: 'Own note 2' });
    const shared = await a.activity({ dealId: d.id, description: 'Shared with the deal' });
    const preview = await a.http().get(`/api/contacts/${c.id}/delete-preview`).expect(200);
    expect(preview.body).toEqual({ activitiesToDelete: 2, activitiesToKeep: 1, dealsToUnlink: 1 });

    await a.http().delete(`/api/contacts/${c.id}`).expect(204);
    expect((await a.http().get(`/api/deals/${d.id}`)).body.contactId).toBeNull();
    const dealTimeline = (await a.http().get(`/api/deals/${d.id}/timeline`)).body;
    expect(dealTimeline).toEqual([expect.objectContaining({ id: shared.id, contact: null })]);
  });

  it('deletes a deal with its activities and stage changes (X4)', async () => {
    const org = await a.org();
    const d = await a.deal(org.id);
    await a.move(d.id, 'qualified', 0).expect(200);
    await a.activity({ dealId: d.id, description: 'Deal note' });
    const preview = await a.http().get(`/api/deals/${d.id}/delete-preview`).expect(200);
    expect(preview.body).toEqual({ activitiesToDelete: 2, activitiesToKeep: 0 });
    await a.http().delete(`/api/deals/${d.id}`).expect(204);
    await a.http().get(`/api/deals/${d.id}`).expect(404);
    expect(await t.prisma.activity.count()).toBe(0);
  });

  it('keeps an activity on both a contact and a deal until neither is left (X5)', async () => {
    const org = await a.org();
    const c = await a.contact({ organizationId: org.id });
    const d = await a.deal(org.id, { contactId: c.id });
    const both = await a.activity({ dealId: d.id, description: 'On both' });
    expect(both.contact.id).toBe(c.id);

    await a.http().delete(`/api/deals/${d.id}`).expect(204);
    const left = await t.prisma.activity.findUnique({ where: { id: both.id } });
    expect(left).toMatchObject({ contactId: c.id, dealId: null });

    await a.http().delete(`/api/contacts/${c.id}`).expect(204);
    expect(await t.prisma.activity.findUnique({ where: { id: both.id } })).toBeNull();
  });
});

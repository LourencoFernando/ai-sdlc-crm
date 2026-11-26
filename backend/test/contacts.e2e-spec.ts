import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

describe('contacts (C1, C3)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it('checks the email and keeps it unique ignoring case', async () => {
    let res = await a
      .http()
      .post('/api/contacts')
      .send({ firstName: 'A', lastName: 'B', email: 'not-an-email' })
      .expect(422);
    expect(res.body.fields.email).toBe('Enter a valid email address');
    const c = await a.contact({ email: ' Dana@Fleet.example ' });
    expect(c.email).toBe('dana@fleet.example');
    res = await a
      .http()
      .post('/api/contacts')
      .send({ firstName: 'X', lastName: 'Y', email: 'DANA@fleet.example' })
      .expect(409);
    expect(res.body.fields.email).toBe('Already used by Dana Reyes');
    // Saving the same contact with its own email is fine.
    await a.http().patch(`/api/contacts/${c.id}`).send({ email: 'dana@fleet.example' }).expect(200);
  });

  it('defaults the status to Lead and filters by ?status=', async () => {
    const lead = await a.contact({ firstName: 'Lena', lastName: 'Lead' });
    expect(lead.status).toBe('lead');
    await a.contact({ firstName: 'Cass', lastName: 'Customer', status: 'customer' });
    const res = await a.http().get('/api/contacts?status=customer').expect(200);
    expect(res.body.map((c: { lastName: string }) => c.lastName)).toEqual(['Customer']);
    await a.http().get('/api/contacts?status=vip').expect(422);
  });

  it("doesn't change the status when a deal is won", async () => {
    const org = await a.org();
    const c = await a.contact({ firstName: 'Wynn', lastName: 'Lead', organizationId: org.id });
    const deal = await a.deal(org.id, { contactId: c.id });
    await a.http().patch(`/api/deals/${deal.id}`).send({ stage: 'won', today: '2026-11-20' }).expect(200);
    const res = await a.http().get(`/api/contacts/${c.id}`).expect(200);
    expect(res.body.status).toBe('lead');
  });

  it('shows the organization and the deals where it is main contact (C4)', async () => {
    const org = await a.org({ name: 'Orbitra Software' });
    const c = await a.contact({ firstName: 'Nadia', lastName: 'Lindqvist', organizationId: org.id });
    await a.deal(org.id, { name: 'Analytics seats', contactId: c.id });
    const res = await a.http().get(`/api/contacts/${c.id}`).expect(200);
    expect(res.body.organization).toEqual({ id: org.id, name: 'Orbitra Software' });
    expect(res.body.deals.map((d: { name: string }) => d.name)).toEqual(['Analytics seats']);
  });
});

describe("changing a contact's organization", () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it('previews, refuses without confirmUnlink, and unlinks with it', async () => {
    const acme = await a.org({ name: 'Acme' });
    const other = await a.org({ name: 'Other' });
    const c = await a.contact({ organizationId: acme.id });
    const d1 = await a.deal(acme.id, { name: 'Renewal', contactId: c.id });
    const d2 = await a.deal(acme.id, { name: 'Expansion', contactId: c.id });

    const preview = await a
      .http()
      .get(`/api/contacts/${c.id}/organization-change-preview?organizationId=${other.id}`)
      .expect(200);
    expect(preview.body.deals).toEqual([
      { id: d2.id, name: 'Expansion' },
      { id: d1.id, name: 'Renewal' },
    ]);
    const toNone = await a.http().get(`/api/contacts/${c.id}/organization-change-preview?organizationId=`).expect(200);
    expect(toNone.body.deals).toHaveLength(2);
    const same = await a
      .http()
      .get(`/api/contacts/${c.id}/organization-change-preview?organizationId=${acme.id}`)
      .expect(200);
    expect(same.body.deals).toEqual([]);

    const refused = await a.http().patch(`/api/contacts/${c.id}`).send({ organizationId: other.id }).expect(409);
    expect(refused.body.deals.map((d: { name: string }) => d.name)).toEqual(['Expansion', 'Renewal']);
    expect((await a.http().get(`/api/contacts/${c.id}`)).body.organizationId).toBe(acme.id);

    await a.http().patch(`/api/contacts/${c.id}`).send({ organizationId: other.id, confirmUnlink: true }).expect(200);
    expect((await a.http().get(`/api/deals/${d1.id}`)).body.contactId).toBeNull();
    expect((await a.http().get(`/api/deals/${d2.id}`)).body.contactId).toBeNull();
    expect((await a.http().get(`/api/contacts/${c.id}`)).body.organizationId).toBe(other.id);
  });
});

import { createTestApp, TestApp } from './support/test-app';
import { api, TODAY } from './support/api';

describe('activities and timelines (A1–A3, A6)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  let org: { id: number };
  let contact: { id: number };
  let deal: { id: number };
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
    org = await a.org();
    contact = await a.contact({ organizationId: org.id });
    deal = await a.deal(org.id, { contactId: contact.id });
  });
  afterAll(() => t.close());

  it('needs a description, and a contact or a deal', async () => {
    let res = await a.http().post('/api/activities').send({ kind: 'note', description: ' ', contactId: contact.id }).expect(422);
    expect(res.body.fields.description).toBe('Enter a description');
    res = await a.http().post('/api/activities').send({ kind: 'note', description: 'Orphan' }).expect(422);
    expect(res.body.fields.contactId).toBeDefined();
    await a.http().post('/api/activities').send({ kind: 'stage_change', description: 'x', dealId: deal.id }).expect(422);
  });

  it("relates an activity logged on a deal to its main contact, unless that's turned off (A2)", async () => {
    const both = await a.activity({ dealId: deal.id, description: 'Call about terms' });
    expect(both).toMatchObject({ deal: { id: deal.id }, contact: { id: contact.id } });
    const dealOnly = await a.activity({ dealId: deal.id, relateToMainContact: false, description: 'Internal note' });
    expect(dealOnly.contact).toBeNull();
    const contactTimeline = (await a.http().get(`/api/contacts/${contact.id}/timeline`)).body;
    expect(contactTimeline.map((x: { description: string }) => x.description)).toContain('Call about terms');
    expect(contactTimeline.map((x: { description: string }) => x.description)).not.toContain('Internal note');
  });

  it('relates the main contact when a deal is chosen with no contact, as the dashboard form sends it (A2)', async () => {
    const chosen = await a.activity({ dealId: deal.id, contactId: null, relateToMainContact: true, description: 'From the dashboard' });
    expect(chosen).toMatchObject({ deal: { id: deal.id }, contact: { id: contact.id } });
    const noFlag = await a.activity({ dealId: deal.id, contactId: null, description: 'No flag sent' });
    expect(noFlag.contact).toMatchObject({ id: contact.id });
    const off = await a.activity({ dealId: deal.id, contactId: null, relateToMainContact: false, description: 'Turned off' });
    expect(off.contact).toBeNull();
  });

  it('lists the timeline newest first by date, then by creation time (A3)', async () => {
    const c = await a.contact({ firstName: 'Tim', lastName: 'Line' });
    await a.activity({ contactId: c.id, description: 'old', occurredOn: '2026-10-01' });
    await a.activity({ contactId: c.id, description: 'same day first', occurredOn: '2026-11-10' });
    await a.activity({ contactId: c.id, description: 'same day second', occurredOn: '2026-11-10' });
    await a.activity({ contactId: c.id, description: 'newest', occurredOn: '2026-11-19' });
    const res = await a.http().get(`/api/contacts/${c.id}/timeline`).expect(200);
    expect(res.body.map((x: { description: string }) => x.description)).toEqual(['newest', 'same day second', 'same day first', 'old']);
  });

  it('marks a follow-up done and undone (A6)', async () => {
    const f = await a.activity({ contactId: contact.id, description: 'Send pricing', followUpOn: '2026-11-25' });
    expect(f.done).toBe(false);
    let res = await a.http().patch(`/api/activities/${f.id}`).send({ done: true }).expect(200);
    expect(res.body.done).toBe(true);
    res = await a.http().patch(`/api/activities/${f.id}`).send({ done: false }).expect(200);
    expect(res.body.done).toBe(false);
  });

  it('only marks a follow-up done, and clears done when the date is removed', async () => {
    const plain = await a.activity({ contactId: contact.id, description: 'Plain note' });
    await a.http().patch(`/api/activities/${plain.id}`).send({ done: true }).expect(422);
    const f = await a.activity({ contactId: contact.id, description: 'Chase', followUpOn: TODAY, done: true });
    const res = await a.http().patch(`/api/activities/${f.id}`).send({ followUpOn: null }).expect(200);
    expect(res.body).toMatchObject({ followUpOn: null, done: false });
  });

  it('edits and deletes an activity (A4)', async () => {
    const x = await a.activity({ contactId: contact.id, description: 'Typo' });
    const res = await a.http().patch(`/api/activities/${x.id}`).send({ description: 'Fixed', kind: 'call' }).expect(200);
    expect(res.body).toMatchObject({ description: 'Fixed', kind: 'call' });
    await a.http().delete(`/api/activities/${x.id}`).expect(204);
    await a.http().patch(`/api/activities/${x.id}`).send({ description: 'Gone' }).expect(404);
  });
});

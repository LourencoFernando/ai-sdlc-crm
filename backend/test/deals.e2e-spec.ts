import { createTestApp, TestApp } from './support/test-app';
import { api, TODAY } from './support/api';

describe('deals (D1, D2, D3, D7)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  let org: { id: number };
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
    org = await a.org();
  });
  afterAll(() => t.close());

  const timeline = async (id: number) => (await a.http().get(`/api/deals/${id}/timeline`).expect(200)).body;

  it('needs an organization, and a main contact from that organization', async () => {
    let res = await a.http().post('/api/deals').send({ name: 'X', value: 1, closeDate: TODAY }).expect(422);
    expect(res.body.fields.organizationId).toBeDefined();
    const elsewhere = await a.org({ name: 'Elsewhere' });
    const stranger = await a.contact({ firstName: 'Sam', lastName: 'Stranger', organizationId: elsewhere.id });
    res = await a.http().post('/api/deals').send({ name: 'X', organizationId: org.id, contactId: stranger.id, value: 1, closeDate: TODAY }).expect(422);
    expect(res.body.fields.contactId).toBe('Choose a contact from Acme');
    const unknownOrg = await a.http().post('/api/deals').send({ name: 'X', organizationId: 9999, value: 1, closeDate: TODAY }).expect(422);
    expect(unknownOrg.body.fields.organizationId).toBeDefined();
  });

  it("refuses a negative value and a probability outside 0 to 100", async () => {
    let res = await a.http().post('/api/deals').send({ name: 'X', organizationId: org.id, value: -1, closeDate: TODAY }).expect(422);
    expect(res.body.fields.value).toBeDefined();
    res = await a.http().post('/api/deals').send({ name: 'X', organizationId: org.id, value: 1, probability: 101, closeDate: TODAY }).expect(422);
    expect(res.body.fields.probability).toBeDefined();
    res = await a.http().post('/api/deals').send({ name: 'X', organizationId: org.id, value: 1, probability: -1, closeDate: TODAY }).expect(422);
    expect(res.body.fields.probability).toBeDefined();
    res = await a.http().post('/api/deals').send({ name: 'X', organizationId: org.id, value: 1, closeDate: '2026-02-30' }).expect(422);
    expect(res.body.fields.closeDate).toBeDefined();
  });

  it('takes the stage probability when new, and keeps a hand-set one until the stage changes (D2)', async () => {
    const d = await a.deal(org.id, { stage: 'proposal' });
    expect(d.probability).toBe(50);
    let res = await a.http().patch(`/api/deals/${d.id}`).send({ probability: 35, today: TODAY }).expect(200);
    expect(res.body.probability).toBe(35);
    res = await a.http().patch(`/api/deals/${d.id}`).send({ name: 'Renamed', today: TODAY }).expect(200);
    expect(res.body.probability).toBe(35);
    res = await a.http().patch(`/api/deals/${d.id}`).send({ stage: 'negotiation', today: TODAY }).expect(200);
    expect(res.body.probability).toBe(75);
  });

  it('lets the probability sent with a stage change win (D2)', async () => {
    const d = await a.deal(org.id, { stage: 'proposal' });
    const res = await a.http().patch(`/api/deals/${d.id}`).send({ stage: 'negotiation', probability: 60, today: TODAY }).expect(200);
    expect(res.body).toMatchObject({ stage: 'negotiation', probability: 60 });
  });

  it('sets the close date to today on Won or Lost, keeps a later edit, and keeps it when reopened (D3)', async () => {
    const d = await a.deal(org.id, { stage: 'negotiation', closeDate: '2027-01-31' });
    let res = await a.http().patch(`/api/deals/${d.id}`).send({ stage: 'won', closeDate: '2027-01-31', today: TODAY }).expect(200);
    expect(res.body).toMatchObject({ stage: 'won', probability: 100, closeDate: TODAY });
    res = await a.http().patch(`/api/deals/${d.id}`).send({ closeDate: '2026-11-15', today: TODAY }).expect(200);
    expect(res.body.closeDate).toBe('2026-11-15');
    res = await a.http().patch(`/api/deals/${d.id}`).send({ stage: 'proposal', today: TODAY }).expect(200);
    expect(res.body).toMatchObject({ stage: 'proposal', probability: 50, closeDate: '2026-11-15' });

    const l = await a.deal(org.id, { stage: 'new' });
    res = await a.http().patch(`/api/deals/${l.id}`).send({ stage: 'lost', today: '2026-11-21' }).expect(200);
    expect(res.body).toMatchObject({ probability: 0, closeDate: '2026-11-21' });
  });

  it('adds one stage-change entry dated today per change, and none without one (D7)', async () => {
    const d = await a.deal(org.id, { stage: 'proposal' });
    await a.http().patch(`/api/deals/${d.id}`).send({ name: 'Same stage', stage: 'proposal', today: TODAY }).expect(200);
    expect(await timeline(d.id)).toEqual([]);
    await a.http().patch(`/api/deals/${d.id}`).send({ stage: 'negotiation', today: TODAY }).expect(200);
    await a.move(d.id, 'won', 0).expect(200);
    const entries = await timeline(d.id);
    expect(entries.map((e: { description: string }) => e.description)).toEqual([
      'Moved from Negotiation to Won',
      'Moved from Proposal to Negotiation',
    ]);
    expect(entries[1]).toMatchObject({ kind: 'stage_change', occurredOn: TODAY, fromStage: 'proposal', toStage: 'negotiation', contact: null });
  });

  it("won't let a stage-change entry be edited or deleted (D7)", async () => {
    const d = await a.deal(org.id, { stage: 'new' });
    await a.move(d.id, 'qualified', 0).expect(200);
    const [entry] = await timeline(d.id);
    await a.http().patch(`/api/activities/${entry.id}`).send({ description: 'Edited' }).expect(409);
    await a.http().delete(`/api/activities/${entry.id}`).expect(409);
    expect((await timeline(d.id))[0].description).toBe('Moved from New to Qualified');
  });

  it('refuses a change of organization that leaves the main contact behind', async () => {
    const c = await a.contact({ firstName: 'Mo', lastName: 'Main', organizationId: org.id });
    const d = await a.deal(org.id, { contactId: c.id });
    const other = await a.org({ name: 'Other Co' });
    await a.http().patch(`/api/deals/${d.id}`).send({ organizationId: other.id }).expect(422);
    const res = await a.http().patch(`/api/deals/${d.id}`).send({ organizationId: other.id, contactId: null }).expect(200);
    expect(res.body).toMatchObject({ organizationId: other.id, contactId: null, organization: { name: 'Other Co' } });
  });
});

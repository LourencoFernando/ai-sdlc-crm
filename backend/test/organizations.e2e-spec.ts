import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

describe('organizations (O1, O2)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it('needs a name, and an industry from the list', async () => {
    const res = await a.http().post('/api/organizations').send({ name: '  ', industry: 'Farming' }).expect(422);
    expect(Object.keys(res.body.fields).sort()).toEqual(['industry', 'name']);
  });

  it('creates, reads and updates, trimming text', async () => {
    const org = await a.org({ name: '  Corvo Manufacturing ', website: '', industry: 'Manufacturing' });
    expect(org.name).toBe('Corvo Manufacturing');
    expect(org.website).toBeNull();
    const updated = await a.http().patch(`/api/organizations/${org.id}`).send({ notes: 'Two plants' }).expect(200);
    expect(updated.body).toMatchObject({ name: 'Corvo Manufacturing', notes: 'Two plants' });
    await a.http().patch(`/api/organizations/${org.id}`).send({ name: '' }).expect(422);
  });

  it('saves a website without a scheme as https, and refuses other schemes', async () => {
    expect((await a.org({ name: 'Bare', website: ' acme.com/about ' })).website).toBe('https://acme.com/about');
    expect((await a.org({ name: 'Plain http', website: 'http://acme.com' })).website).toBe('http://acme.com');
    expect((await a.org({ name: 'Upper', website: 'HTTPS://Acme.com' })).website).toBe('HTTPS://Acme.com');
    for (const website of ['javascript:alert(1)', 'ftp://acme.com', 'mailto:a@acme.com', 'acme com']) {
      const res = await a.http().post('/api/organizations').send({ name: 'Bad', website }).expect(422);
      expect(res.body.fields.website).toBe('Enter a web address, such as acme.com');
    }
    const org = await a.org({ name: 'Patched' });
    const res = await a.http().patch(`/api/organizations/${org.id}`).send({ website: 'patched.example' }).expect(200);
    expect(res.body.website).toBe('https://patched.example');
  });

  it('lists contact count, open deal count and open pipeline, leaving out Won and Lost', async () => {
    const org = await a.org({ name: 'Pinecrest Hotels' });
    await a.contact({ firstName: 'Elena', lastName: 'Kovacs', organizationId: org.id });
    await a.deal(org.id, { value: 20_000, stage: 'proposal' });
    await a.deal(org.id, { value: 5_000, stage: 'new' });
    await a.deal(org.id, { value: 99_000, stage: 'won' });
    await a.deal(org.id, { value: 77_000, stage: 'lost' });
    const res = await a.http().get('/api/organizations').expect(200);
    const row = res.body.find((o: { id: number }) => o.id === org.id);
    expect(row).toMatchObject({ contactCount: 1, openDealCount: 2, openPipeline: 25_000 });
  });

  it('shows its contacts and deals on its page (O3)', async () => {
    const org = await a.org({ name: 'Kestrel Health' });
    const c = await a.contact({ firstName: 'Priya', lastName: 'Nair', organizationId: org.id });
    await a.deal(org.id, { name: 'Patient portal', contactId: c.id });
    const res = await a.http().get(`/api/organizations/${org.id}`).expect(200);
    expect(res.body.contacts.map((x: { name: string }) => x.name)).toEqual(['Priya Nair']);
    expect(res.body.deals[0]).toMatchObject({ name: 'Patient portal', contact: { id: c.id, name: 'Priya Nair' } });
  });
});

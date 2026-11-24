import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

/** A web page on another site can post a plain form to this computer, so changes are accepted only as JSON. */
describe('changes only as JSON', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it.each([
    ['application/x-www-form-urlencoded', 'name=Form+Org'],
    ['multipart/form-data; boundary=x', '--x\r\nContent-Disposition: form-data; name="name"\r\n\r\nForm Org\r\n--x--\r\n'],
    ['text/plain', '{"name":"Form Org"}'],
  ])('refuses a %s body with 415 and saves nothing', async (type, body) => {
    const res = await a.http().post('/api/organizations').set('Content-Type', type).send(body).expect(415);
    expect(res.body).toEqual({ detail: 'Send changes as JSON' });
    const orgs = (await a.http().get('/api/organizations').expect(200)).body as { name: string }[];
    expect(orgs.map((o) => o.name)).not.toContain('Form Org');
  });

  it('refuses a form post with no fields', async () => {
    await a.http().post('/api/contacts').set('Content-Type', 'application/x-www-form-urlencoded').expect(415);
  });

  it('accepts JSON, and a delete with no body', async () => {
    const org = (await a.http().post('/api/organizations').send({ name: 'Json Org' }).expect(201)).body;
    await a.http().delete(`/api/organizations/${org.id}`).expect(204);
  });
});

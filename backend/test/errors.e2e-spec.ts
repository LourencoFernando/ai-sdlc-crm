import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

describe('API errors', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it('gives 422 naming a missing required field', async () => {
    const res = await a.http().post('/api/organizations').send({}).expect(422);
    expect(res.body.detail).toBeDefined();
    expect(res.body.fields.name).toBe('Enter a name');
  });

  it('gives 409 for a duplicate email, naming the contact who has it', async () => {
    await a.contact({ email: 'dana@acme.example' });
    const res = await a.http().post('/api/contacts').send({ firstName: 'Other', lastName: 'Person', email: 'dana@acme.example' }).expect(409);
    expect(res.body.fields.email).toBe('Already used by Dana Reyes');
  });

  it('gives 404 for an unknown id', async () => {
    for (const path of ['/api/organizations/999', '/api/contacts/999', '/api/deals/999', '/api/deals/abc']) {
      const res = await a.http().get(path).expect(404);
      expect(res.body.detail).toBeDefined();
    }
  });

  it('gives 422 for malformed JSON rather than 400', async () => {
    await a.http().post('/api/organizations').set('Content-Type', 'application/json').send('{bad').expect(422);
  });
});

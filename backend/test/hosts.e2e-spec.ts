import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

/** Only requests addressed to this computer are answered, so a web page can't reach the data through DNS rebinding. */
describe('allowed hosts', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
  });
  afterAll(() => t.close());

  it.each(['localhost', 'localhost:5173', '127.0.0.1:3100', '[::1]:3100', 'LOCALHOST:3100'])(
    'answers Host %s',
    async (host) => {
      await a.http().get('/api/meta').set('Host', host).expect(200);
    },
  );

  it.each(['evil.example', 'evil.example:3100', 'localhost.evil.example', '127.0.0.1.nip.io:3100'])(
    'refuses Host %s with 403',
    async (host) => {
      const res = await a.http().get('/api/contacts').set('Host', host).expect(403);
      expect(res.body).toEqual({ detail: 'Accountable only answers requests sent to this computer' });
    },
  );
});

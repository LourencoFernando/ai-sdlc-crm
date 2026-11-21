import { createTestApp } from './support/test-app';
import { api } from './support/api';

describe('test-only reset endpoint', () => {
  it("doesn't exist unless ACCOUNTABLE_TEST=1", async () => {
    const t = await createTestApp({ testSupport: false });
    await api(t).http().post('/api/test/reset').send({}).expect(404);
    await t.close();
  });

  it('exists in test mode', async () => {
    const t = await createTestApp({ testSupport: true });
    await api(t).org();
    await api(t).http().post('/api/test/reset').send({ today: '2026-11-20' }).expect(204);
    await t.close();
  });
});

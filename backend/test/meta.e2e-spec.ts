import request from 'supertest';
import { createTestApp, TestApp } from './support/test-app';

describe('GET /api/meta', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it('returns the six stages in order with their probabilities, and the industries', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/meta').expect(200);
    expect(res.body.stages.map((s: { key: string }) => s.key)).toEqual([
      'new',
      'qualified',
      'proposal',
      'negotiation',
      'won',
      'lost',
    ]);
    expect(res.body.stages.map((s: { probability: number }) => s.probability)).toEqual([10, 25, 50, 75, 100, 0]);
    expect(res.body.industries).toContain('Software');
    expect(res.body.industries).toHaveLength(13);
  });
});

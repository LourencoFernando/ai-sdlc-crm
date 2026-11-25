import request from 'supertest';
import { TestApp } from './test-app';

export const TODAY = '2026-11-20';

/** Small helpers that create records through the API, failing loudly if a create fails. */
export function api(t: TestApp) {
  const http = () => request(t.app.getHttpServer());
  async function post(path: string, body: object) {
    const res = await http().post(path).send(body);
    if (res.status >= 300) throw new Error(`POST ${path} gave ${res.status}: ${JSON.stringify(res.body)}`);
    return res.body;
  }
  return {
    http,
    org: (body: object = {}) => post('/api/organizations', { name: 'Acme', industry: 'Software', ...body }),
    contact: (body: object = {}) => post('/api/contacts', { firstName: 'Dana', lastName: 'Reyes', ...body }),
    deal: (organizationId: number, body: object = {}) =>
      post('/api/deals', {
        name: 'Acme renewal',
        organizationId,
        value: 10_000,
        closeDate: '2026-12-31',
        today: TODAY,
        ...body,
      }),
    activity: (body: object) =>
      post('/api/activities', { kind: 'note', description: 'Spoke about pricing', occurredOn: TODAY, ...body }),
    move: (id: number, stage: string, index: number) =>
      http().post(`/api/deals/${id}/move`).send({ stage, index, today: TODAY }),
    async column(stage: string): Promise<number[]> {
      const res = await http().get('/api/deals');
      return res.body
        .filter((d: { stage: string }) => d.stage === stage)
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((d: { id: number }) => d.id);
    },
  };
}

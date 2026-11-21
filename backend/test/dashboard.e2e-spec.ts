import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';

const TODAY = '2026-11-20';

describe('dashboard (B1–B8)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  let open: { id: number };
  beforeAll(async () => {
    t = await createTestApp();
    a = api(t);
    const org = await a.org();
    const c = await a.contact({ organizationId: org.id });
    open = await a.deal(org.id, { name: 'Open proposal', stage: 'proposal', value: 40_000, closeDate: '2026-12-10', contactId: c.id });
    await a.deal(org.id, { name: 'Late one', stage: 'new', value: 10_000, closeDate: '2026-11-19' });
    await a.deal(org.id, { name: 'Won this month', stage: 'won', value: 30_000, closeDate: '2026-11-02' });
    await a.deal(org.id, { name: 'Won last month', stage: 'won', value: 12_000, closeDate: '2026-10-31' });
    await a.deal(org.id, { name: 'Won too long ago', stage: 'won', value: 50_000, closeDate: '2025-11-30' });
    await a.deal(org.id, { name: 'Lost in May', stage: 'lost', value: 8_000, closeDate: '2026-05-04' });
    await a.activity({ contactId: c.id, description: 'Overdue older', followUpOn: '2026-11-01', occurredOn: '2026-10-25' });
    await a.activity({ contactId: c.id, description: 'Overdue newer', followUpOn: '2026-11-18', occurredOn: '2026-10-26' });
    await a.activity({ dealId: open.id, description: 'Due in a week', followUpOn: '2026-11-27', occurredOn: '2026-10-27' });
    await a.activity({ contactId: c.id, description: 'Due tomorrow', followUpOn: '2026-11-21', occurredOn: '2026-10-28' });
    await a.activity({ contactId: c.id, description: 'Not yet', followUpOn: '2026-11-28', occurredOn: '2026-10-29' });
    await a.activity({ contactId: c.id, description: 'Done already', followUpOn: '2026-11-02', done: true, occurredOn: '2026-10-30' });
  });
  afterAll(() => t.close());

  const get = async () => (await a.http().get(`/api/dashboard?today=${TODAY}`).expect(200)).body;

  it('gives the headline figures and the overdue and late counts (B1)', async () => {
    const d = await get();
    expect(d.headline).toEqual({
      wonThisMonth: { value: 30_000, count: 1 },
      wonLastMonth: { value: 12_000, count: 1 },
      openPipeline: { value: 50_000, count: 2 },
      expectedRevenue: 21_000,
      overdueFollowUps: 2,
      lateDeals: 1,
    });
  });

  it('gives 12 months with empty months as zero (B2, B3)', async () => {
    const d = await get();
    expect(d.months).toHaveLength(12);
    expect(d.months[0].month).toBe('2025-12');
    expect(d.months.find((m: { month: string }) => m.month === '2026-05')).toEqual({ month: '2026-05', revenueWon: 0, won: 0, lost: 1 });
    expect(d.months[11]).toEqual({ month: '2026-11', revenueWon: 30_000, won: 1, lost: 0 });
    expect(d.yearTotals).toEqual({ revenueWon: 42_000, won: 2 });
  });

  it('gives the funnel and its kept share, and pipeline by stage (B4, B5)', async () => {
    const d = await get();
    const won = 30_000 + 12_000 + 50_000;
    expect(d.funnel[0]).toEqual({ stage: 'new', value: 50_000 + won, count: 5, keptShare: null });
    expect(d.funnel[2]).toEqual({ stage: 'proposal', value: 40_000 + won, count: 4, keptShare: 100 });
    expect(d.funnel[3]).toMatchObject({ stage: 'negotiation', value: won, keptShare: Math.round((won / (40_000 + won)) * 100) });
    expect(d.pipelineByStage.map((s: { share: number }) => s.share)).toEqual([20, 0, 80, 0]);
  });

  it('lists follow-ups overdue oldest first and due soon soonest first, 7 days ahead included (B6)', async () => {
    const d = await get();
    expect(d.followUps.overdue.map((f: { description: string }) => f.description)).toEqual(['Overdue older', 'Overdue newer']);
    expect(d.followUps.dueSoon.map((f: { description: string }) => f.description)).toEqual(['Due tomorrow', 'Due in a week']);
    expect(d.followUps.dueSoon[1]).toMatchObject({ deal: { id: open.id, name: 'Open proposal' }, contact: { name: 'Dana Reyes' } });
  });

  it('gives the 10 newest activities (B7)', async () => {
    const d = await get();
    expect(d.recent).toHaveLength(6);
    expect(d.recent[0].description).toBe('Done already');
  });

  it('changes straight away when a deal is won (B8)', async () => {
    await a.move(open.id, 'won', 0).expect(200);
    const d = await a.http().get(`/api/dashboard?today=${TODAY}`).expect(200);
    expect(d.body.headline.wonThisMonth).toEqual({ value: 70_000, count: 2 });
    expect(d.body.headline.openPipeline).toEqual({ value: 10_000, count: 1 });
    expect(d.body.recent[0].description).toBe('Moved from Proposal to Won');
  });

  it('refuses a malformed today', async () => {
    await a.http().get('/api/dashboard?today=2026-13-45').expect(422);
  });
});

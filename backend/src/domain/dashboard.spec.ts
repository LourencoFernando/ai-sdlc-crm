import { buildDashboard, DashboardActivity, DashboardDeal } from './dashboard';

const today = '2026-11-20';

let nextId = 1;
function deal(stage: DashboardDeal['stage'], value: number, closeDate: string, probability?: number): DashboardDeal {
  const probs = { new: 10, qualified: 25, proposal: 50, negotiation: 75, won: 100, lost: 0 };
  return { id: nextId++, name: `Deal ${nextId}`, stage, value, probability: probability ?? probs[stage], closeDate };
}

function activity(partial: Partial<DashboardActivity>): DashboardActivity {
  const id = nextId++;
  return {
    id, kind: 'note', description: `Activity ${id}`, occurredOn: '2026-11-01', followUpOn: null, done: false,
    createdAt: new Date(2026, 10, 1, 9, 0, id), contact: null, deal: null, ...partial,
  };
}

const deals: DashboardDeal[] = [
  deal('new', 10_000, '2026-12-10'),
  deal('new', 20_000, '2026-11-01'), // late
  deal('qualified', 40_000, '2027-01-15'),
  deal('proposal', 30_000, '2026-11-19', 40), // late, hand-set probability
  deal('negotiation', 50_000, '2026-12-31'),
  deal('won', 25_000, '2026-11-03'),
  deal('won', 15_000, '2026-11-20'),
  deal('won', 30_000, '2026-10-31'),
  deal('won', 99_000, '2025-11-30'), // 12 months + 1 ago: outside the charts
  deal('won', 5_000, '2025-12-01'),
  deal('lost', 12_000, '2026-11-05'),
  deal('lost', 8_000, '2026-06-15'),
];

const activities: DashboardActivity[] = [
  activity({ followUpOn: '2026-11-10', description: 'Older overdue' }),
  activity({ followUpOn: '2026-11-19', description: 'Newer overdue' }),
  activity({ followUpOn: '2026-11-27', description: 'Exactly 7 days ahead' }),
  activity({ followUpOn: '2026-11-20', description: 'Due today' }),
  activity({ followUpOn: '2026-11-28', description: 'Too far ahead' }),
  activity({ followUpOn: '2026-11-01', done: true, description: 'Done' }),
];

describe('dashboard figures (B1–B7)', () => {
  const d = buildDashboard({ deals, activities, recent: activities, today });

  it('gives the headline figures (B1)', () => {
    expect(d.headline.wonThisMonth).toEqual({ value: 40_000, count: 2 });
    expect(d.headline.wonLastMonth).toEqual({ value: 30_000, count: 1 });
    expect(d.headline.openPipeline).toEqual({ value: 150_000, count: 5 });
    // 1,000 + 2,000 + 10,000 + 12,000 + 37,500
    expect(d.headline.expectedRevenue).toBe(62_500);
  });

  it('counts overdue follow-ups and late deals (B1)', () => {
    expect(d.headline.overdueFollowUps).toBe(2);
    expect(d.headline.lateDeals).toBe(2);
  });

  it('gives 12 months of revenue won and deals won and lost, with empty months as zero (B2, B3)', () => {
    expect(d.months).toHaveLength(12);
    expect(d.months[0]).toEqual({ month: '2025-12', revenueWon: 5_000, won: 1, lost: 0 });
    expect(d.months.find((m) => m.month === '2026-06')).toEqual({ month: '2026-06', revenueWon: 0, won: 0, lost: 1 });
    expect(d.months.find((m) => m.month === '2026-03')).toEqual({ month: '2026-03', revenueWon: 0, won: 0, lost: 0 });
    expect(d.months[11]).toEqual({ month: '2026-11', revenueWon: 40_000, won: 2, lost: 1 });
    expect(d.yearTotals).toEqual({ revenueWon: 75_000, won: 4 });
  });

  it('builds the funnel from the value at each stage or beyond, leaving out Lost (B4)', () => {
    const won = 25_000 + 15_000 + 30_000 + 99_000 + 5_000;
    expect(d.funnel.map((s) => s.stage)).toEqual(['new', 'qualified', 'proposal', 'negotiation', 'won']);
    expect(d.funnel[0]).toEqual({ stage: 'new', value: 150_000 + won, count: 10, keptShare: null });
    expect(d.funnel[1]).toMatchObject({ stage: 'qualified', value: 120_000 + won, count: 8 });
    expect(d.funnel[1].keptShare).toBe(Math.round(((120_000 + won) / (150_000 + won)) * 100));
    expect(d.funnel[4]).toMatchObject({ stage: 'won', value: won, count: 5 });
  });

  it('gives each open stage its share of the open value (B5)', () => {
    expect(d.pipelineByStage).toEqual([
      { stage: 'new', value: 30_000, count: 2, expectedRevenue: 3_000, share: 20 },
      { stage: 'qualified', value: 40_000, count: 1, expectedRevenue: 10_000, share: 26.67 },
      { stage: 'proposal', value: 30_000, count: 1, expectedRevenue: 12_000, share: 20 },
      { stage: 'negotiation', value: 50_000, count: 1, expectedRevenue: 37_500, share: 33.33 },
    ]);
  });

  it('lists overdue oldest first and due soon soonest first, 7 days ahead included (B6)', () => {
    expect(d.followUps.overdue.map((f) => f.description)).toEqual(['Older overdue', 'Newer overdue']);
    expect(d.followUps.dueSoon.map((f) => f.description)).toEqual(['Due today', 'Exactly 7 days ahead']);
  });

  it('gives the 10 newest activities, newest first by date then creation (B7)', () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      activity({ occurredOn: `2026-11-${String(i + 1).padStart(2, '0')}`, createdAt: new Date(2026, 0, 1, 0, 0, i) }),
    );
    const sameDay = [
      activity({ occurredOn: '2026-11-14', createdAt: new Date(2026, 10, 14, 8), description: 'first' }),
      activity({ occurredOn: '2026-11-14', createdAt: new Date(2026, 10, 14, 9), description: 'second' }),
    ];
    const r = buildDashboard({ deals: [], activities: [], recent: [...many, ...sameDay], today });
    expect(r.recent).toHaveLength(10);
    expect(r.recent.slice(0, 3).map((a) => a.description)).toEqual(['second', 'first', many[13].description]);
  });

  it('copes with no data', () => {
    const r = buildDashboard({ deals: [], activities: [], recent: [], today });
    expect(r.headline.openPipeline).toEqual({ value: 0, count: 0 });
    expect(r.funnel[1].keptShare).toBeNull();
    expect(r.pipelineByStage.every((s) => s.share === 0)).toBe(true);
  });
});

import { createTestApp, TestApp } from './support/test-app';
import { api, TODAY } from './support/api';

describe('moving deals (P4, P6, P13)', () => {
  let t: TestApp;
  let a: ReturnType<typeof api>;
  let orgId: number;

  // Fresh columns for each test: New [n0..n3] top to bottom, Qualified [q0..q2].
  let n: number[];
  let q: number[];
  beforeEach(async () => {
    t = await createTestApp();
    a = api(t);
    orgId = (await a.org()).id;
    n = [];
    q = [];
    // A new deal goes to the top, so create bottom-up.
    for (let i = 3; i >= 0; i--) n.unshift((await a.deal(orgId, { name: `n${i}`, stage: 'new' })).id);
    for (let i = 2; i >= 0; i--) q.unshift((await a.deal(orgId, { name: `q${i}`, stage: 'qualified' })).id);
  });
  afterEach(() => t.close());

  const positionsOf = async (stage: string) => {
    const res = await a.http().get('/api/deals');
    return res.body.filter((d: { stage: string }) => d.stage === stage).map((d: { position: number }) => d.position).sort((x: number, y: number) => x - y);
  };
  const stageChanges = async () => {
    const all = await Promise.all([...n, ...q].map((id) => a.http().get(`/api/deals/${id}/timeline`)));
    return all.flatMap((r) => r.body).filter((e: { kind: string }) => e.kind === 'stage_change');
  };

  it('puts a new deal at the top of its column', async () => {
    expect(await a.column('new')).toEqual(n);
    const fresh = await a.deal(orgId, { name: 'fresh', stage: 'new' });
    expect(await a.column('new')).toEqual([fresh.id, ...n]);
  });

  it('moves to the top, middle and end of another column', async () => {
    let res = await a.move(n[1], 'qualified', 0).expect(200);
    expect(res.body.columns).toEqual({ new: [n[0], n[2], n[3]], qualified: [n[1], ...q] });
    res = await a.move(n[2], 'qualified', 2).expect(200);
    expect(res.body.columns.qualified).toEqual([n[1], q[0], n[2], q[1], q[2]]);
    res = await a.move(n[3], 'qualified', 5).expect(200);
    expect(res.body.columns.qualified).toEqual([n[1], q[0], n[2], q[1], q[2], n[3]]);
    expect(await a.column('qualified')).toEqual(res.body.columns.qualified);
    expect(await a.column('new')).toEqual([n[0]]);
  });

  it('moves to an empty column', async () => {
    const res = await a.move(n[0], 'proposal', 0).expect(200);
    expect(res.body.columns.proposal).toEqual([n[0]]);
    expect(res.body.deal).toMatchObject({ stage: 'proposal', probability: 50, position: 0 });
  });

  it('moves within a column, up and down, to the top and to the end', async () => {
    let res = await a.move(n[2], 'new', 1).expect(200);
    expect(res.body.columns).toEqual({ new: [n[0], n[2], n[1], n[3]] });
    res = await a.move(n[0], 'new', 2).expect(200);
    expect(res.body.columns.new).toEqual([n[2], n[1], n[0], n[3]]);
    res = await a.move(n[3], 'new', 0).expect(200);
    expect(res.body.columns.new).toEqual([n[3], n[2], n[1], n[0]]);
    res = await a.move(n[3], 'new', 3).expect(200);
    expect(res.body.columns.new).toEqual([n[2], n[1], n[0], n[3]]);
    expect(await a.column('new')).toEqual(res.body.columns.new);
    expect(await stageChanges()).toHaveLength(0);
  });

  it('puts the card at the end when the index is past it', async () => {
    const res = await a.move(n[0], 'new', 50).expect(200);
    expect(res.body.columns.new).toEqual([n[1], n[2], n[3], n[0]]);
  });

  it('renumbers both columns from 0 with no gaps or repeats', async () => {
    await a.move(n[1], 'qualified', 1).expect(200);
    await a.move(q[2], 'new', 0).expect(200);
    expect(await positionsOf('new')).toEqual([0, 1, 2, 3]);
    expect(await positionsOf('qualified')).toEqual([0, 1, 2]);
  });

  it('changes nothing when moved to the same place, and adds no entry', async () => {
    const before = (await a.http().get(`/api/deals/${n[1]}`)).body;
    const res = await a.move(n[1], 'new', 1).expect(200);
    expect(res.body.columns.new).toEqual(n);
    const after = (await a.http().get(`/api/deals/${n[1]}`)).body;
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(await stageChanges()).toHaveLength(0);
  });

  it('adds exactly one entry when moved to another column', async () => {
    await a.move(n[0], 'qualified', 1).expect(200);
    const entries = await stageChanges();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ description: 'Moved from New to Qualified', occurredOn: TODAY });
  });

  it('sets the close date to today into Won or Lost, and keeps it with the stage probability when moved out', async () => {
    let res = await a.move(n[0], 'won', 0).expect(200);
    expect(res.body.deal).toMatchObject({ stage: 'won', probability: 100, closeDate: TODAY });
    res = await a.move(n[0], 'proposal', 0).expect(200);
    expect(res.body.deal).toMatchObject({ stage: 'proposal', probability: 50, closeDate: TODAY });
    res = await a.move(n[1], 'lost', 0).expect(200);
    expect(res.body.deal).toMatchObject({ stage: 'lost', probability: 0, closeDate: TODAY });
  });

  it('puts a deal saved into Won from its form at the top of Won', async () => {
    await a.move(n[0], 'won', 0).expect(200);
    await a.move(n[1], 'won', 1).expect(200);
    await a.http().patch(`/api/deals/${n[2]}`).send({ stage: 'won', today: TODAY }).expect(200);
    expect(await a.column('won')).toEqual([n[2], n[0], n[1]]);
    expect(await positionsOf('new')).toEqual([0]);
  });

  it('refuses an unknown deal or stage and changes nothing', async () => {
    await a.http().post('/api/deals/9999/move').send({ stage: 'new', index: 0, today: TODAY }).expect(404);
    const res = await a.http().post(`/api/deals/${n[0]}/move`).send({ stage: 'archived', index: 0, today: TODAY }).expect(422);
    expect(res.body.fields.stage).toBeDefined();
    await a.http().post(`/api/deals/${n[0]}/move`).send({ stage: 'new', index: -1, today: TODAY }).expect(422);
    expect(await a.column('new')).toEqual(n);
    expect((await a.http().get(`/api/deals/${n[0]}`)).body.stage).toBe('new');
  });
});

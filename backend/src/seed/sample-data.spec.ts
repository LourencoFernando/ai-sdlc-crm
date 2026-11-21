import { buildSampleData, SampleData } from './sample-data';
import { followUpStatus } from '../domain/follow-ups';
import { isLate } from '../domain/deal-rules';
import { addDays, lastMonths, monthKey } from '../domain/dates';
import { STAGE_KEYS, Stage } from '../domain/stages';

function checks(today: string) {
  let data: SampleData;
  beforeAll(() => {
    data = buildSampleData(today);
  });

  it('has the counts and the status mix (S1)', () => {
    expect(data.organizations).toHaveLength(25);
    expect(data.contacts).toHaveLength(80);
    expect(data.deals).toHaveLength(60);
    const regular = data.activities.filter((a) => a.kind !== 'stage_change');
    expect(regular).toHaveLength(200);
    const count = (s: string) => data.contacts.filter((c) => c.status === s).length;
    expect(count('lead')).toBe(40);
    expect(count('qualified')).toBe(20);
    expect(count('customer')).toBe(20);
    const without = data.contacts.filter((c) => c.organizationId === null).length;
    expect(without).toBeGreaterThanOrEqual(2);
    expect(without).toBeLessThanOrEqual(6);
  });

  it('spans at least 8 industries (S1)', () => {
    expect(new Set(data.organizations.map((o) => o.industry)).size).toBeGreaterThanOrEqual(8);
  });

  it('keeps emails unique and main contacts in their deal organization', () => {
    const emails = data.contacts.map((c) => c.email).filter(Boolean);
    expect(new Set(emails).size).toBe(emails.length);
    for (const d of data.deals) {
      if (d.contactId === null) continue;
      expect(data.contacts.find((c) => c.id === d.contactId)!.organizationId).toBe(d.organizationId);
    }
  });

  it('uses every stage, and has won and lost deals in every one of the last 12 months (S2)', () => {
    expect(new Set(data.deals.map((d) => d.stage))).toEqual(new Set(STAGE_KEYS));
    for (const month of lastMonths(today, 12)) {
      const closed = data.deals.filter((d) => monthKey(d.closeDate) === month);
      expect(closed.some((d) => d.stage === 'won')).toBe(true);
      expect(closed.some((d) => d.stage === 'lost')).toBe(true);
    }
    // Won this month is never empty, even on the 1st.
    expect(data.deals.some((d) => d.stage === 'won' && monthKey(d.closeDate) === monthKey(today) && d.closeDate <= today)).toBe(true);
    expect(data.deals.filter((d) => d.stage === 'won' || d.stage === 'lost').every((d) => d.closeDate <= today)).toBe(true);
  });

  it('has 3 to 5 late deals, and the other open deals close within 4 months (S2)', () => {
    const late = data.deals.filter((d) => isLate({ stage: d.stage, closeDate: d.closeDate }, today));
    expect(late.length).toBeGreaterThanOrEqual(3);
    expect(late.length).toBeLessThanOrEqual(5);
    const open = data.deals.filter((d) => !['won', 'lost'].includes(d.stage) && d.closeDate >= today);
    expect(open.length).toBeGreaterThan(15);
    expect(open.every((d) => d.closeDate <= addDays(today, 123))).toBe(true);
  });

  it('has about 8 follow-ups due soon, 5 overdue and some done (S3)', () => {
    const status = data.activities.map((a) => followUpStatus(a, today));
    expect(status.filter((s) => s === 'due_soon')).toHaveLength(8);
    expect(status.filter((s) => s === 'overdue')).toHaveLength(5);
    expect(status.filter((s) => s === 'done').length).toBeGreaterThan(3);
  });

  it('dates every activity in the past year, never in the future', () => {
    for (const a of data.activities) {
      expect(a.occurredOn <= today).toBe(true);
      expect(a.occurredOn >= lastMonths(today, 13)[0]).toBe(true);
    }
  });

  it('gives each deal past New stage-change entries that match its stage (S3)', () => {
    for (const d of data.deals) {
      const changes = data.activities
        .filter((a) => a.kind === 'stage_change' && a.dealId === d.id)
        .sort((x, y) => (x.occurredOn < y.occurredOn ? -1 : x.occurredOn > y.occurredOn ? 1 : x.seq - y.seq));
      if (d.stage === 'new') {
        expect(changes).toHaveLength(0);
        continue;
      }
      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].fromStage).toBe('new');
      expect(changes[changes.length - 1].toStage).toBe(d.stage);
      for (let i = 1; i < changes.length; i++) expect(changes[i].fromStage).toBe(changes[i - 1].toStage);
      for (const c of changes) expect(c.contactId).toBeNull();
      if (d.stage === 'won' || d.stage === 'lost') expect(changes[changes.length - 1].occurredOn).toBe(d.closeDate);
    }
  });

  it('gives each column positions from 0 with no gaps', () => {
    for (const stage of STAGE_KEYS as Stage[]) {
      const positions = data.deals.filter((d) => d.stage === stage).map((d) => d.position).sort((a, b) => a - b);
      expect(positions).toEqual(positions.map((_, i) => i));
    }
  });
}

describe('sample data seeded on Nov 20, 2026', () => checks('2026-11-20'));
describe('sample data seeded on the 1st of a month', () => checks('2026-12-01'));
describe('sample data seeded on Jan 1', () => checks('2027-01-01'));
describe('sample data seeded at the end of February', () => checks('2028-02-29'));

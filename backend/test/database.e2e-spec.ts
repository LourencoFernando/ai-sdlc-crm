import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { createTestApp, TestApp } from './support/test-app';
import { api } from './support/api';
import { seedDatabase, seedIfEmpty } from '../src/seed/seed-database';
import { databasePath } from '../src/config/database';

describe('database setting (G3, G4)', () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await createTestApp();
  });
  afterEach(() => t.close());

  it('writes to the file named by ACCOUNTABLE_DB', async () => {
    expect(databasePath()).toBe(t.dbFile);
    await api(t).org({ name: 'Written to the file' });
    // A separate client opened on the file itself sees the row.
    const other = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${t.dbFile}` }) });
    const rows = await other.organization.findMany({ select: { name: true } });
    await other.$disconnect();
    expect(rows).toEqual([{ name: 'Written to the file' }]);
  });

  it('seeds a new, empty database, and leaves one with data alone', async () => {
    expect(await seedIfEmpty(t.prisma, '2026-11-20')).toBe(true);
    expect(await t.prisma.organization.count()).toBe(25);
    expect(await t.prisma.contact.count()).toBe(80);
    expect(await t.prisma.deal.count()).toBe(60);
    await api(t).org({ name: 'One more' });
    expect(await seedIfEmpty(t.prisma, '2026-11-20')).toBe(false);
    expect(await t.prisma.organization.count()).toBe(26);
  });

  it('replaces everything with fresh sample data on seed', async () => {
    await api(t).org({ name: 'Mine' });
    await seedDatabase(t.prisma, '2026-11-20');
    expect(await t.prisma.organization.count()).toBe(25);
    expect(await t.prisma.organization.findFirst({ where: { name: 'Mine' } })).toBeNull();
  });

  it('gives a dashboard with data in every panel after seeding', async () => {
    await seedDatabase(t.prisma, '2026-12-01');
    const res = await api(t).http().get('/api/dashboard?today=2026-12-01').expect(200);
    expect(res.body.headline.wonThisMonth.count).toBeGreaterThan(0);
    expect(res.body.followUps.overdue).toHaveLength(5);
    expect(res.body.followUps.dueSoon).toHaveLength(8);
    expect(res.body.headline.lateDeals).toBe(4);
    expect(res.body.months.every((m: { won: number; lost: number }) => m.won > 0 && m.lost > 0)).toBe(true);
    expect(res.body.recent).toHaveLength(10);
  });
});

import { PrismaClient } from '../generated/prisma/client';
import { CalendarDate } from '../domain/dates';
import { buildSampleData } from './sample-data';
import { clearDatabase } from './clear';

/** Replaces all data with fresh sample data built for `today` (G4). */
export async function seedDatabase(prisma: PrismaClient, today: CalendarDate) {
  const data = buildSampleData(today);
  await clearDatabase(prisma);
  // createdAt follows the activity date, so "newest first" reads naturally.
  const createdAt = (date: CalendarDate, seq: number) => new Date(`${date}T09:00:00.000Z`).getTime() + seq * 1000;
  await prisma.$transaction([
    prisma.organization.createMany({ data: data.organizations }),
    prisma.contact.createMany({ data: data.contacts }),
    prisma.deal.createMany({ data: data.deals }),
    prisma.activity.createMany({
      data: data.activities.map(({ seq, ...a }) => ({ ...a, createdAt: new Date(createdAt(a.occurredOn, seq)) })),
    }),
  ]);
  return {
    organizations: data.organizations.length,
    contacts: data.contacts.length,
    deals: data.deals.length,
    activities: data.activities.length,
  };
}

/** Fills a new, empty database with sample data; leaves any other database alone. */
export async function seedIfEmpty(prisma: PrismaClient, today: CalendarDate): Promise<boolean> {
  const [orgs, contacts, deals, activities] = await Promise.all([
    prisma.organization.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.activity.count(),
  ]);
  if (orgs + contacts + deals + activities > 0) return false;
  await seedDatabase(prisma, today);
  return true;
}

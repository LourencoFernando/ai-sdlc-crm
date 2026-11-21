import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { databasePath, databaseUrl } from '../config/database';
import { localToday } from '../domain/dates';
import { seedDatabase } from './seed-database';

/** `npm run seed`: replaces all data with fresh sample data. */
async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl() }) });
  try {
    const counts = await seedDatabase(prisma, localToday());
    console.log(
      `Sample data loaded into ${databasePath()}: ${counts.organizations} organizations, ${counts.contacts} contacts, ` +
        `${counts.deals} deals and ${counts.activities} activities.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

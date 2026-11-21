import { PrismaClient } from '../generated/prisma/client';

/** Deletes every row, children first. */
export async function clearDatabase(prisma: Pick<PrismaClient, '$transaction' | 'activity' | 'deal' | 'contact' | 'organization'>) {
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.organization.deleteMany(),
  ]);
}

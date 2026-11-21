import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { localToday } from '../domain/dates';
import { seedIfEmpty } from './seed-database';

/** A new, empty database gets the sample data on start (G4). */
export async function seedOnStart(app: INestApplication): Promise<void> {
  if (await seedIfEmpty(app.get(PrismaService), localToday())) {
    console.log('New database: loaded the sample data.');
  }
}

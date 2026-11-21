import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { resolveToday } from '../common/today';
import { PrismaService } from '../prisma/prisma.service';
import { clearDatabase } from '../seed/clear';
import { seedDatabase } from '../seed/seed-database';

/** Only loaded when ACCOUNTABLE_TEST=1: lets each end-to-end test start from fresh sample data. */
@Controller('test')
export class TestSupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset')
  @HttpCode(204)
  async reset(@Body() body: { today?: string; empty?: boolean }): Promise<void> {
    const today = resolveToday(body?.today);
    if (body?.empty) await clearDatabase(this.prisma);
    else await seedDatabase(this.prisma, today);
  }
}

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { resolveToday } from '../common/today';
import { PrismaService } from '../prisma/prisma.service';
import { clearDatabase } from '../seed/clear';

/** Only loaded when ACCOUNTABLE_TEST=1: lets each end-to-end test start from fresh data. */
@Controller('test')
export class TestSupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset')
  @HttpCode(204)
  async reset(@Body() body: { today?: string; empty?: boolean }): Promise<void> {
    resolveToday(body?.today);
    await clearDatabase(this.prisma);
  }
}

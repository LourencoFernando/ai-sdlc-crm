import { Controller, Get, Query } from '@nestjs/common';
import { resolveToday } from '../common/today';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@Query('today') today?: string) {
    return this.dashboard.get(resolveToday(today));
  }
}

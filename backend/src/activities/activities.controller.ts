import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IdPipe } from '../common/id.pipe';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';
import { ActivitiesService } from './activities.service';

@Controller()
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post('activities')
  create(@Body() dto: CreateActivityDto) {
    return this.activities.create(dto);
  }

  @Patch('activities/:id')
  update(@Param('id', IdPipe) id: number, @Body() dto: UpdateActivityDto) {
    return this.activities.update(id, dto);
  }

  @Delete('activities/:id')
  @HttpCode(204)
  delete(@Param('id', IdPipe) id: number) {
    return this.activities.delete(id);
  }

  @Get('contacts/:id/timeline')
  contactTimeline(@Param('id', IdPipe) id: number) {
    return this.activities.contactTimeline(id);
  }

  @Get('deals/:id/timeline')
  dealTimeline(@Param('id', IdPipe) id: number) {
    return this.activities.dealTimeline(id);
  }
}

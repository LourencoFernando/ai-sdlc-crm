import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IdPipe } from '../common/id.pipe';
import { CreateDealDto, MoveDealDto, UpdateDealDto } from './deal.dto';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  list() {
    return this.deals.list();
  }

  @Post()
  create(@Body() dto: CreateDealDto) {
    return this.deals.create(dto);
  }

  @Get(':id')
  get(@Param('id', IdPipe) id: number) {
    return this.deals.get(id);
  }

  @Patch(':id')
  update(@Param('id', IdPipe) id: number, @Body() dto: UpdateDealDto) {
    return this.deals.update(id, dto);
  }

  @Post(':id/move')
  @HttpCode(200)
  move(@Param('id', IdPipe) id: number, @Body() dto: MoveDealDto) {
    return this.deals.move(id, dto);
  }

  @Get(':id/delete-preview')
  deletePreview(@Param('id', IdPipe) id: number) {
    return this.deals.deletePreview(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', IdPipe) id: number) {
    return this.deals.delete(id);
  }
}

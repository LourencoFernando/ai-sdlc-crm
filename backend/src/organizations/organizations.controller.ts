import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IdPipe } from '../common/id.pipe';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list() {
    return this.organizations.list();
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto);
  }

  @Get(':id')
  get(@Param('id', IdPipe) id: number) {
    return this.organizations.get(id);
  }

  @Patch(':id')
  update(@Param('id', IdPipe) id: number, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.update(id, dto);
  }

  @Get(':id/delete-preview')
  deletePreview(@Param('id', IdPipe) id: number) {
    return this.organizations.deletePreview(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', IdPipe) id: number) {
    return this.organizations.delete(id);
  }
}

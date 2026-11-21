import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IdPipe } from '../common/id.pipe';
import { ApiError } from '../common/api-error';
import { CreateContactDto, UpdateContactDto } from './contact.dto';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.contacts.list(status);
  }

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Get(':id')
  get(@Param('id', IdPipe) id: number) {
    return this.contacts.get(id);
  }

  @Patch(':id')
  update(@Param('id', IdPipe) id: number, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Get(':id/organization-change-preview')
  organizationChangePreview(@Param('id', IdPipe) id: number, @Query('organizationId') organizationId?: string) {
    let target: number | null = null;
    if (organizationId !== undefined && organizationId !== '' && organizationId !== 'null') {
      target = Number(organizationId);
      if (!Number.isInteger(target)) throw ApiError.invalid({ organizationId: 'Choose an organization' });
    }
    return this.contacts.organizationChangePreview(id, target);
  }

  @Get(':id/delete-preview')
  deletePreview(@Param('id', IdPipe) id: number) {
    return this.contacts.deletePreview(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', IdPipe) id: number) {
    return this.contacts.delete(id);
  }
}

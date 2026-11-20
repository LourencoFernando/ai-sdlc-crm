import { Controller, Get } from '@nestjs/common';
import { STAGES } from '../domain/stages';
import { INDUSTRIES } from '../domain/industries';

@Controller('meta')
export class MetaController {
  @Get()
  get() {
    return { stages: STAGES, industries: INDUSTRIES };
  }
}

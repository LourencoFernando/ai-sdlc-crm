import { INestApplication } from '@nestjs/common';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { allowedHosts } from './common/allowed-hosts';
import { jsonOnly } from './common/json-only';
import { createValidationPipe } from './common/validation';

/** Settings shared by the real app and the API tests. */
export function configureApp(app: INestApplication): void {
  app.use(allowedHosts);
  app.use(jsonOnly);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
}

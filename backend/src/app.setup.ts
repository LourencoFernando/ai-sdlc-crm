import { INestApplication } from '@nestjs/common';

/** Settings shared by the real app and the API tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
}

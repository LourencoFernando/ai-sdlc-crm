import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { seedOnStart } from './seed/seed-on-start';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule.create(), { logger: ['error', 'warn'] });
  configureApp(app);
  await seedOnStart(app);
  const port = Number(process.env.PORT ?? 3100);
  await app.listen(port, '127.0.0.1');
  console.log(`Accountable API listening on http://127.0.0.1:${port}/api`);
}

void bootstrap();

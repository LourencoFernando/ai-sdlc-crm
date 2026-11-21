import * as fs from 'node:fs';
import * as path from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';

let counter = 0;

/** Copies the migrated template to a fresh file and points ACCOUNTABLE_DB at it. */
export function freshDatabase(): string {
  const template = process.env.ACCOUNTABLE_TEST_TEMPLATE_DB;
  if (!template) throw new Error('The Jest global setup did not create a template database');
  const file = path.join(path.dirname(template), `test-${process.pid}-${Date.now()}-${counter++}.db`);
  fs.copyFileSync(template, file);
  process.env.ACCOUNTABLE_DB = file;
  return file;
}

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  dbFile: string;
  close(): Promise<void>;
}

/** A Nest app on its own fresh database, set up like the real one. */
export async function createTestApp(options: { testSupport?: boolean } = {}): Promise<TestApp> {
  const dbFile = freshDatabase();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule.create({ testSupport: options.testSupport })] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  return {
    app,
    prisma,
    dbFile,
    async close() {
      await app.close();
      fs.rmSync(dbFile, { force: true });
    },
  };
}

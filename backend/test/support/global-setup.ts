import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/** Migrates one template database; each test file copies it (see test-app.ts). */
export default function globalSetup(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'accountable-jest-'));
  const template = path.join(dir, 'template.db');
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, ACCOUNTABLE_DB: template },
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  process.env.ACCOUNTABLE_TEST_TEMPLATE_DB = template;
}

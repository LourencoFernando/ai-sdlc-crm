import * as fs from 'node:fs';
import * as path from 'node:path';

export default function globalTeardown(): void {
  const template = process.env.ACCOUNTABLE_TEST_TEMPLATE_DB;
  if (template) fs.rmSync(path.dirname(template), { recursive: true, force: true });
}

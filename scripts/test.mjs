// Runs every test suite, even when an earlier one fails, then exits 1 if any failed.
import { spawnSync } from 'node:child_process';

const suites = [
  ['Backend (Jest and Supertest)', 'npm run test -w backend'],
  ['Frontend (Vitest)', 'npm run test -w frontend'],
  ['End-to-end (Playwright)', 'npm run test:e2e'],
];

const results = suites.map(([name, command]) => {
  console.log(`\n=== ${name}: ${command}\n`);
  const { status } = spawnSync(command, { stdio: 'inherit', shell: true });
  return { name, passed: status === 0 };
});

console.log('\n=== Summary');
for (const { name, passed } of results) console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}`);

process.exit(results.every((r) => r.passed) ? 0 : 1);

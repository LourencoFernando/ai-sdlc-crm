// Runs every check, even when an earlier one fails, then exits 1 if any failed.
// `--quick` runs the same checks without the end-to-end tests.
import { spawnSync } from 'node:child_process';

const quick = process.argv.includes('--quick');

const checks = [
  ['Prettier', 'prettier --check .'],
  ['ESLint', 'eslint . --max-warnings 0'],
  ['TypeScript (tsc)', 'npm run typecheck'],
  ['gitleaks (git history)', 'gitleaks git --no-banner --redact'],
  ['gitleaks (working tree)', 'gitleaks dir . --no-banner --redact'],
  [quick ? 'Tests without end-to-end' : 'Tests', quick ? 'node scripts/test.mjs --skip-e2e' : 'npm test'],
];

const results = checks.map(([name, command]) => {
  console.log(`\n=== ${name}: ${command}\n`);
  const { status } = spawnSync(command, { stdio: 'inherit', shell: true });
  if (status === 127) console.log(`\n${command.split(' ')[0]} isn't installed.`);
  return { name, passed: status === 0 };
});

console.log('\n=== Check summary');
for (const { name, passed } of results) console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}`);

process.exit(results.every((r) => r.passed) ? 0 : 1);

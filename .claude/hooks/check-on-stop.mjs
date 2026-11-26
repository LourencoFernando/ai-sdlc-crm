// Claude Code Stop hook: runs `npm run check:quick` when the agent finishes a turn.
// If a check fails, it blocks the stop once and sends the output back to fix. When the
// agent is already continuing because of this hook (`stop_hook_active`), it lets it stop,
// so it can't loop forever.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX_OUTPUT = 20000;

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
if (input.stop_hook_active) process.exit(0);

const { status, stdout, stderr } = spawnSync('npm run check:quick', {
  cwd: process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd(),
  shell: true,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
if (status === 0) process.exit(0);

const output = `${stdout ?? ''}${stderr ?? ''}`;
const shown = output.length > MAX_OUTPUT ? `…\n${output.slice(-MAX_OUTPUT)}` : output;
const reason = `npm run check:quick failed. Fix what it reports without weakening a rule, then run it again.\n\n${shown}`;
console.log(JSON.stringify({ decision: 'block', reason }));

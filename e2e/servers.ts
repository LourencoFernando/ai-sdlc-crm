import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * A backend and frontend of their own, for tests that stop and start the backend.
 * They use the backend build that `npm run test:e2e` makes first.
 */
const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

export function tempDatabase(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'accountable-e2e-own-')), 'own.db');
}

async function waitFor(url: string, timeout = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`${url} did not start within ${timeout}ms`);
}

function prisma(args: string[], env: NodeJS.ProcessEnv) {
  execFileSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), ...args], {
    cwd: backendDir,
    env,
    stdio: 'pipe',
  });
}

export class Backend {
  private child: ChildProcess | null = null;
  constructor(
    readonly port: number,
    readonly db: string,
  ) {}

  get env(): NodeJS.ProcessEnv {
    return { ...process.env, PORT: String(this.port), ACCOUNTABLE_DB: this.db, ACCOUNTABLE_TEST: '' };
  }

  /** Like `npm run start`: apply migrations, then start; a new database is seeded on start. */
  async start(): Promise<void> {
    prisma(['migrate', 'deploy'], this.env);
    this.child = spawn(process.execPath, ['build/main.js'], { cwd: backendDir, env: this.env, stdio: 'ignore' });
    await waitFor(`http://127.0.0.1:${this.port}/api/meta`);
  }

  async stop(): Promise<void> {
    const child = this.child;
    this.child = null;
    if (!child || child.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      child.kill('SIGTERM');
    });
  }
}

export class Frontend {
  private child: ChildProcess | null = null;
  constructor(
    readonly port: number,
    readonly apiPort: number,
  ) {}

  get url(): string {
    return `http://localhost:${this.port}`;
  }

  async start(): Promise<void> {
    this.child = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js')], {
      cwd: frontendDir,
      env: { ...process.env, API_PORT: String(this.apiPort), WEB_PORT: String(this.port) },
      stdio: 'ignore',
    });
    await waitFor(this.url);
  }

  async stop(): Promise<void> {
    const child = this.child;
    this.child = null;
    if (!child || child.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      child.kill('SIGTERM');
    });
  }
}

/** `npm run seed` against a given database file. */
export function runSeed(db: string): string {
  return execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'seed'], {
    cwd: root,
    env: { ...process.env, ACCOUNTABLE_DB: db },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

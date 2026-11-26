import * as fs from 'node:fs';
import * as path from 'node:path';

/** The repo root: the nearest folder above this file whose package.json has workspaces. */
export function repoRoot(): string {
  let dir = __dirname;
  for (;;) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg) && JSON.parse(fs.readFileSync(pkg, 'utf8')).workspaces) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

/**
 * The database file: `ACCOUNTABLE_DB` when set (relative paths are read from the repo root),
 * otherwise `data/accountable.db`. Its folder is created if it's missing.
 */
export function databasePath(): string {
  const configured = process.env.ACCOUNTABLE_DB;
  const file = configured ? path.resolve(repoRoot(), configured) : path.join(repoRoot(), 'data', 'accountable.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
}

/** The SQLite URL for Prisma, with forward slashes so it also works on Windows. */
export function databaseUrl(): string {
  return `file:${databasePath().split(path.sep).join('/')}`;
}

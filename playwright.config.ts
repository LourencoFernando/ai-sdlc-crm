import { defineConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// The end-to-end tests run on their own ports with a database of their own.
export const E2E_API_PORT = 3101;
export const E2E_WEB_PORT = 5174;

// Set once in the runner process; workers inherit it, so they all agree on the file.
if (!process.env.ACCOUNTABLE_E2E_DB) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'accountable-e2e-'));
  process.env.ACCOUNTABLE_E2E_DB = path.join(dir, 'e2e.db');
}

function chromeIsInstalled(): boolean {
  const candidates: Record<string, string[]> = {
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    win32: [
      path.join(process.env['PROGRAMFILES'] ?? 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['LOCALAPPDATA'] ?? '', 'Google/Chrome/Application/chrome.exe'),
    ],
    linux: ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'],
  };
  return (candidates[process.platform] ?? []).some((p) => fs.existsSync(p));
}

if (!chromeIsInstalled()) {
  throw new Error(
    'The end-to-end tests need Google Chrome installed. Install it from https://www.google.com/chrome/ and run npm test again.',
  );
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    timezoneId: process.env.TZ || undefined,
  },
  webServer: [
    {
      command: 'npm run start -w backend',
      url: `http://127.0.0.1:${E2E_API_PORT}/api/meta`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        PORT: String(E2E_API_PORT),
        ACCOUNTABLE_DB: process.env.ACCOUNTABLE_E2E_DB!,
        ACCOUNTABLE_TEST: '1',
      },
    },
    {
      command: 'npm run dev -w frontend',
      url: `http://localhost:${E2E_WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { API_PORT: String(E2E_API_PORT), WEB_PORT: String(E2E_WEB_PORT) },
    },
  ],
});

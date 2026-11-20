import { test as base, expect } from '@playwright/test';

/**
 * Every test fails on a console error or on any request that leaves localhost (G2, G8).
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`Console error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`Page error: ${err.message}`));
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') {
          problems.push(`Request left localhost: ${req.url()}`);
        }
      });
      await use();
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

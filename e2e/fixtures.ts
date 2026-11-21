import { test as base, expect } from '@playwright/test';

/**
 * Every test starts from fresh sample data, and fails on a console error or on any request that leaves localhost (G2, G8).
 */
export const API_URL = 'http://127.0.0.1:3101';

/** Today on this computer, as the browser sees it. */
export function localToday(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export const test = base.extend<{ guard: void; allowedErrors: RegExp[] }>({
  /** Console errors a test causes on purpose, such as a move the server is made to refuse. */
  allowedErrors: [[], { option: true }],
  guard: [
    async ({ page, request, allowedErrors }, use) => {
      // Fresh sample data for every test.
      const reset = await request.post(`${API_URL}/api/test/reset`, { data: { today: localToday() } });
      expect(reset.status(), 'reset the test database').toBe(204);

      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        // Chrome logs every 4xx response. A 409 or 422 is the backend refusing bad input, which the
        // form shows under its field; those are expected. Anything else is a problem.
        if (/Failed to load resource: the server responded with a status of (409|422)/.test(msg.text())) return;
        if (allowedErrors.some((re) => re.test(msg.text()))) return;
        problems.push(`Console error: ${msg.text()}`);
      });
      page.on('response', (res) => {
        if (res.status() >= 400 && ![409, 422].includes(res.status()) && !allowedErrors.some((re) => re.test(String(res.status())))) {
          problems.push(`Response ${res.status()} for ${res.request().method()} ${res.url()}`);
        }
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

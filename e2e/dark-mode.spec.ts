import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// Token values from tokens.css, as the browser reports them.
const LIGHT_CANVAS = 'rgb(245, 246, 248)';
const DARK = {
  canvas: 'rgb(20, 21, 27)',
  surface: 'rgb(29, 30, 39)',
  raised: 'rgb(38, 40, 52)',
  text: 'rgb(231, 232, 239)',
  inverse: 'rgb(231, 232, 239)',
  onInverse: 'rgb(29, 30, 39)',
  divider: 'rgb(43, 45, 57)',
};

const html = (page: Page) => page.locator('html');
const body = (page: Page) => page.locator('body');
const darkSwitch = (page: Page) => page.getByRole('switch', { name: 'Dark mode' });

async function turnDarkOn(page: Page) {
  await darkSwitch(page).click();
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
}

test('opens in light mode when nothing is saved (G11)', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await expect(body(page)).toHaveCSS('background-color', LIGHT_CANVAS);
});

test('the switch turns dark mode on and off, and the choice is remembered after a reload (criterion 2)', async ({
  page,
}) => {
  await page.goto('/');
  await turnDarkOn(page);
  await expect(body(page)).toHaveCSS('background-color', DARK.canvas);

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await expect(body(page)).toHaveCSS('background-color', DARK.canvas);

  await darkSwitch(page).click();
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect(body(page)).toHaveCSS('background-color', LIGHT_CANVAS);
});

test('the keyboard works the switch', async ({ page }) => {
  await page.goto('/');
  await darkSwitch(page).focus();
  await page.keyboard.press('Space');
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'false');
});

test('switching does not reload the page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => ((window as unknown as { marker?: string }).marker = 'still here'));
  await turnDarkOn(page);
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe('still here');
});

test.describe('before the app runs', () => {
  // Blocking the script files makes Chrome log failed loads, which is the point of this test.
  test.use({ allowedErrors: [/ERR_FAILED/] });

  test('a saved dark mode is already applied, with no flash of light (G11)', async ({ page }) => {
    await page.goto('/');
    await turnDarkOn(page);

    // Only the inline script in index.html can run now.
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'script' ? route.abort() : route.continue(),
    );
    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(body(page)).toHaveCSS('background-color', DARK.canvas);
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  });
});

test('every screen follows dark mode (G8, G11)', async ({ page }) => {
  await page.goto('/');
  await turnDarkOn(page);

  for (const [link, ready] of [
    ['Dashboard', page.getByRole('heading', { level: 1, name: 'Dashboard' })],
    ['Organizations', page.getByText('Showing 1–25 of 25')],
    ['Contacts', page.getByText('Showing 1–25 of 80')],
    ['Deals', page.getByText('Showing 1–25 of 60')],
    ['Pipeline', page.locator('[data-deal-id]').first()],
  ] as const) {
    await page.getByRole('link', { name: link, exact: true }).click();
    await expect(ready).toBeVisible();
    await expect(body(page)).toHaveCSS('background-color', DARK.canvas);
    await expect(body(page)).toHaveCSS('color', DARK.text);
  }

  await page.getByRole('link', { name: 'Deals', exact: true }).click();
  await page.locator('tbody tr').first().click();
  await expect(page.getByRole('list', { name: 'Timeline' })).toBeVisible();
  await expect(page.locator('.panel').first()).toHaveCSS('background-color', DARK.surface);
});

test('dialogs, tooltips, toasts and charts follow dark mode', async ({ page }) => {
  await page.goto('/');
  await turnDarkOn(page);

  // A chart gridline on the dashboard.
  await expect(page.locator('.recharts-cartesian-grid line').first()).toHaveCSS('stroke', DARK.divider);

  // A dialog, rendered in a portal outside the app's root.
  await page.getByRole('button', { name: 'New deal' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'New deal' });
  await expect(dialog).toHaveCSS('background-color', DARK.raised);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // A tooltip on the collapsed sidebar.
  await page.getByRole('button', { name: 'Collapse menu' }).click();
  await page.getByRole('link', { name: 'Contacts', exact: true }).hover();
  const tooltip = page.locator('.tooltip');
  await expect(tooltip).toHaveCSS('background-color', DARK.inverse);
  await expect(tooltip).toHaveCSS('color', DARK.onInverse);
  await page.getByRole('button', { name: 'Expand menu' }).click();

  // A toast after saving.
  await page.getByRole('link', { name: 'Organizations', exact: true }).click();
  await page
    .getByRole('button', { name: /^Edit / })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  const toast = page.locator('.toast').filter({ hasText: 'Organization saved' });
  await expect(toast).toHaveCSS('background-color', DARK.inverse);
  await expect(toast).toHaveCSS('color', DARK.onInverse);
});

test('the switch works from the collapsed sidebar, and both choices are remembered', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Collapse menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCSS('width', '72px');

  await turnDarkOn(page);
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCSS('width', '72px');
  await expect(darkSwitch(page)).toHaveAttribute('aria-checked', 'true');
});

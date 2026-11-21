import { test, expect } from './fixtures';

test('collapsing the sidebar is remembered after a refresh', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav).toHaveCSS('width', '240px');

  await page.getByRole('button', { name: 'Collapse menu' }).click();
  await expect(page.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveCSS('width', '72px');

  await page.reload();
  await expect(nav).toHaveCSS('width', '72px');
  await expect(page.getByRole('button', { name: 'Expand menu' })).toBeVisible();

  // Icons keep their names, and navigation still works.
  await page.getByRole('link', { name: 'Contacts' }).click();
  await expect(page).toHaveURL(/\/contacts$/);

  await page.getByRole('button', { name: 'Expand menu' }).click();
  await page.reload();
  await expect(nav).toHaveCSS('width', '240px');
});

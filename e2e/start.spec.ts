import { test, expect } from './fixtures';

test('the app opens on the Dashboard with sample data on every screen (G1, criterion 1)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.stat .figure').first()).not.toHaveText('0');

  await page.getByRole('link', { name: 'Organizations', exact: true }).click();
  await expect(page.getByText('Showing 1–25 of 25')).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await expect(page.getByText('Showing 1–25 of 80')).toBeVisible();
  await page.getByRole('link', { name: 'Deals', exact: true }).click();
  await expect(page.getByText('Showing 1–25 of 60')).toBeVisible();
  await page.getByRole('link', { name: 'Pipeline', exact: true }).click();
  await expect(page.locator('[data-deal-id]').first()).toBeVisible();
});

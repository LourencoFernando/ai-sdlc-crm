import { test, expect } from './fixtures';

test('the app opens and reaches the backend', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Negotiation');
});

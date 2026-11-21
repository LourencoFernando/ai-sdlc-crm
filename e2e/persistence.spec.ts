import { test, expect } from './fixtures';
import { Backend, Frontend, runSeed, tempDatabase } from './servers';

const backend = new Backend(3111, tempDatabase());
const frontend = new Frontend(5181, 3111);

test.beforeAll(async () => {
  await backend.start();
  await frontend.start();
});
test.afterAll(async () => {
  await frontend.stop();
  await backend.stop();
});

test('a change survives a restart, and npm run seed brings back the sample data (G3, G4)', async ({ page }) => {
  test.setTimeout(120_000);
  // A new database was migrated and seeded on start.
  await page.goto(`${frontend.url}/organizations`);
  await expect(page.getByText('Showing 1–25 of 25')).toBeVisible();

  await page.getByRole('button', { name: 'New organization' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Persisted Partners');
  await page.getByRole('dialog').getByRole('button', { name: 'Add organization' }).click();
  await expect(page.getByText('Showing 1–25 of 26')).toBeVisible();

  await backend.stop();
  await backend.start();
  await page.reload();
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('Persisted');
  await expect(page.getByRole('link', { name: 'Persisted Partners' })).toBeVisible();

  const output = runSeed(backend.db);
  expect(output).toContain('Sample data loaded');
  await page.reload();
  await expect(page.getByText('Showing 1–25 of 25')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('Persisted');
  await expect(page.getByText('No organizations match your search')).toBeVisible();
});

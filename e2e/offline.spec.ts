import { test, expect } from './fixtures';
import { Backend, Frontend, tempDatabase } from './servers';

const backend = new Backend(3112, tempDatabase());
const frontend = new Frontend(5182, 3112);

test.beforeAll(async () => {
  await backend.start();
  await frontend.start();
});
test.afterAll(async () => {
  await frontend.stop();
  await backend.stop();
});

// With the backend stopped, the dev server's proxy answers 5xx, which Chrome logs. That's the point here.
test.use({ allowedErrors: [/status of 50\d|^50\d$/] });

test("stopping the backend shows Can't reach Accountable, and Retry recovers (G9)", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`${frontend.url}/contacts`);
  await expect(page.getByText('Showing 1–25 of 80')).toBeVisible();

  await backend.stop();
  // A save fails but keeps what was typed.
  await page.getByRole('button', { name: 'New contact' }).click();
  const form = page.getByRole('dialog', { name: 'New contact' });
  await form.getByLabel('First name').fill('Still');
  await form.getByLabel('Last name').fill('Here');
  await form.getByRole('button', { name: 'Add contact' }).click();
  await expect(form.getByRole('alert')).toHaveText("Your changes weren't saved. Can't reach Accountable. Check that it's running.");
  await expect(form.getByLabel('First name')).toHaveValue('Still');
  await form.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click();

  // Loading another screen shows the message instead of an empty page.
  await page.getByRole('link', { name: 'Deals', exact: true }).click();
  await expect(page.getByText("Can't reach Accountable. Check that it's running.")).toBeVisible();
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText("Can't reach Accountable. Check that it's running.")).toBeVisible();

  await backend.start();
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('Showing 1–25 of 60')).toBeVisible();
  await expect(page.getByText("Can't reach Accountable")).toHaveCount(0);
});

import { test, expect, localToday } from './fixtures';
import { deals } from './api';

test('create, search, sort, edit and delete a deal (D1, D5, X4)', async ({ page }) => {
  await page.goto('/deals');
  await expect(page.getByText('Showing 1–25 of 60')).toBeVisible();
  await page.getByRole('button', { name: 'New deal' }).last().click();
  const form = page.getByRole('dialog', { name: 'New deal' });
  await form.getByLabel('Name').fill('Warehouse robotics');
  await form.getByRole('combobox', { name: 'Organization' }).fill('Corvo');
  await page.getByRole('option', { name: 'Corvo Manufacturing' }).click();
  await form.getByLabel(/Main contact/).selectOption({ index: 1 });
  await form.getByLabel('Stage').selectOption('proposal');
  await expect(form.getByLabel('Probability (%)')).toHaveValue('50');
  await form.getByLabel('Value (USD)').fill('64000');
  await form.getByRole('button', { name: 'Add deal' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Deal added/);

  const rows = page.getByRole('table', { name: 'Deals' }).locator('tbody tr');
  await page.getByRole('searchbox', { name: 'Search deals' }).fill('robotics');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Corvo Manufacturing');
  await expect(rows.first()).toContainText('Proposal');
  await expect(rows.first()).toContainText('USD 64,000');
  await expect(rows.first()).toContainText('USD 32,000');

  await page.getByRole('button', { name: 'Edit Warehouse robotics' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit deal' });
  await edit.getByLabel('Probability (%)').fill('60');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(rows.first()).toContainText('60%');

  await page.getByRole('searchbox', { name: 'Search deals' }).fill('');
  await page.getByRole('button', { name: 'Value' }).click();
  await page.getByRole('button', { name: 'Value' }).click();
  await expect(page.getByRole('columnheader', { name: /Value/ })).toHaveAttribute('aria-sort', 'descending');

  await page.getByRole('searchbox', { name: 'Search deals' }).fill('robotics');
  await page.getByRole('button', { name: 'Delete Warehouse robotics' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete Warehouse robotics?' });
  await expect(confirm).toContainText('no activities or stage changes');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No deals match your search')).toBeVisible();
});

test('a negative value and a probability of 101 are refused (D1)', async ({ page }) => {
  await page.goto('/deals');
  await page.getByRole('button', { name: 'New deal' }).last().click();
  const form = page.getByRole('dialog', { name: 'New deal' });
  await form.getByLabel('Name').fill('Bad numbers');
  await form.getByRole('combobox', { name: 'Organization' }).fill('Acme');
  await form.getByRole('combobox', { name: 'Organization' }).fill('Orbitra');
  await page.getByRole('option', { name: 'Orbitra Software' }).click();
  await form.getByLabel('Value (USD)').fill('-100');
  await form.getByLabel('Probability (%)').fill('101');
  await form.getByRole('button', { name: 'Add deal' }).click();
  await expect(form.getByText('Enter a value of 0 or more, in whole dollars')).toBeVisible();
  await expect(form.getByText('Enter a probability from 0 to 100')).toBeVisible();
});

test('late deals show a Late pill and their date in red (D4)', async ({ page, request }) => {
  const today = localToday();
  const late = (await deals(request)).filter((d) => !['won', 'lost'].includes(d.stage) && d.closeDate < today);
  expect(late.length).toBeGreaterThanOrEqual(3);
  await page.goto('/deals');
  await page.getByRole('searchbox', { name: 'Search deals' }).fill(late[0].name);
  const row = page.getByRole('table', { name: 'Deals' }).locator('tbody tr').filter({ hasText: late[0].name }).first();
  await expect(row.locator('.pill-late')).toHaveText('Late');
  await expect(row.locator('time')).toHaveClass(/alert-text/);
});

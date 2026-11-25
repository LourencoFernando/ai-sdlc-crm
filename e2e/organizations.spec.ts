import { test, expect } from './fixtures';
import { deals, organizations } from './api';

test('create, search, sort, edit and delete an organization (T1–T6, X2)', async ({ page }) => {
  await page.goto('/organizations');
  await expect(page.getByText('Showing 1–25 of 25')).toBeVisible();

  // Create
  await page.getByRole('button', { name: 'New organization' }).click();
  const dialog = page.getByRole('dialog', { name: 'New organization' });
  await dialog.getByLabel('Name').fill('Northwind Traders');
  await dialog.getByLabel('Industry').selectOption('Retail');
  await dialog.getByLabel('Website').fill('https://northwind.example');
  await dialog.getByRole('button', { name: 'Add organization' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Organization added/);
  await expect(dialog).toBeHidden();

  // Search ignores case
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('NORTHWIND');
  const rows = page.getByRole('table', { name: 'Organizations' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Northwind Traders');
  await expect(rows.first()).toContainText('northwind.example');

  // Edit from the row
  await page.getByRole('button', { name: 'Edit Northwind Traders' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit organization' });
  await edit.getByLabel('Name').fill('Northwind Trading Co');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('toast').last()).toHaveText(/Organization saved/);
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('northwind');
  await expect(rows.first()).toContainText('Northwind Trading Co');

  // No matches, then clear
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('zzzz');
  await expect(page.getByText('No organizations match your search')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByText('Showing 1–25 of 26')).toBeVisible();

  // Sort by name: up, down, then default
  const header = page.getByRole('button', { name: 'Name' });
  const firstName = () => rows.first().locator('td').first().innerText();
  await header.click();
  await expect(page.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(await firstName()).toBe('Alder & Finch Consulting');
  await header.click();
  await expect(page.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending');
  expect(await firstName()).toBe('Tidewell Energy');
  await header.click();
  await expect(page.getByRole('columnheader', { name: /Name/ })).not.toHaveAttribute('aria-sort');

  // Delete one with no deals: its contacts are kept
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('northwind');
  await page.getByRole('button', { name: 'Delete Northwind Trading Co' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete Northwind Trading Co?' });
  await expect(confirm).toContainText('has no contacts or deals');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No organizations match your search')).toBeVisible();
});

test('an organization with deals cannot be deleted, and the dialog links to its deals (X1)', async ({
  page,
  request,
}) => {
  const org = (await organizations(request)).find((o) => o.name === 'Orbitra Software')!;
  const itsDeals = (await deals(request)).filter((d) => d.organizationId === org.id);
  await page.goto(`/organizations/${org.id}`);
  await page.getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('dialog', { name: "Orbitra Software can't be deleted" });
  await expect(dialog).toContainText(`it has ${itsDeals.length} deals`);
  await expect(dialog.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  for (const d of itsDeals) await expect(dialog.getByRole('link', { name: d.name })).toBeVisible();
  await dialog.getByRole('link', { name: itsDeals[0].name }).click();
  await expect(page).toHaveURL(new RegExp(`/deals/${itsDeals[0].id}$`));
  await expect(page.getByRole('heading', { level: 1, name: itsDeals[0].name })).toBeVisible();
});

test('deleting an organization with no deals keeps its contacts (X2)', async ({ page }) => {
  await page.goto('/organizations');
  await page.getByRole('button', { name: 'New organization' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Solo Studio');
  await page.getByRole('dialog').getByRole('button', { name: 'Add organization' }).click();
  await page.getByRole('searchbox', { name: 'Search organizations' }).fill('Solo Studio');
  await page.getByRole('link', { name: 'Solo Studio' }).click();

  await page.getByRole('button', { name: 'New contact' }).click();
  const form = page.getByRole('dialog', { name: 'New contact' });
  await expect(form.getByRole('combobox', { name: 'Organization' })).toHaveValue('Solo Studio');
  await form.getByLabel('First name').fill('Iris');
  await form.getByLabel('Last name').fill('Vale');
  await form.getByRole('button', { name: 'Add contact' }).click();
  await expect(page.getByRole('link', { name: 'Iris Vale' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete Solo Studio?' });
  await expect(confirm).toContainText('Its 1 contact will be kept without an organization.');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/organizations$/);

  await page.goto('/contacts');
  await page.getByRole('searchbox', { name: 'Search contacts' }).fill('Iris Vale');
  const row = page.getByRole('table', { name: 'Contacts' }).locator('tbody tr').first();
  await expect(row).toContainText('No organization');
});

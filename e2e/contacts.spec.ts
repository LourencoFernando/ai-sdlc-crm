import { test, expect } from './fixtures';
import { contacts, deals, organizations } from './api';

test('create, search, sort, edit and delete a contact (C1, C2, X3)', async ({ page }) => {
  await page.goto('/contacts');
  await expect(page.getByText('Showing 1–25 of 80')).toBeVisible();
  await page.getByRole('button', { name: 'New contact' }).click();
  const form = page.getByRole('dialog', { name: 'New contact' });
  await form.getByLabel('First name').fill('Avery');
  await form.getByLabel('Last name').fill('Quinlan');
  await form.getByLabel('Email').fill('Avery.Quinlan@Orbitra.example');
  await form.getByLabel('Job title').fill('Head of Data');
  await form.getByRole('combobox', { name: 'Organization' }).fill('orbit');
  await page.getByRole('option', { name: 'Orbitra Software' }).click();
  await form.getByRole('button', { name: 'Add contact' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Contact added/);

  const search = page.getByRole('searchbox', { name: 'Search contacts' });
  const rows = page.getByRole('table', { name: 'Contacts' }).locator('tbody tr');
  await search.fill('head of data');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Avery Quinlan');
  await expect(rows.first()).toContainText('avery.quinlan@orbitra.example');
  await expect(rows.first()).toContainText('Lead');

  await page.getByRole('button', { name: 'Edit Avery Quinlan' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit contact' });
  await edit.getByLabel('Status').selectOption('qualified');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(rows.first()).toContainText('Qualified');

  await search.fill('');
  await page.getByRole('button', { name: 'Name' }).click();
  await expect(page.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  await page.getByRole('button', { name: 'Name' }).click();
  await expect(page.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending');

  await search.fill('Avery');
  await page.getByRole('button', { name: 'Delete Avery Quinlan' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete Avery Quinlan?' });
  await expect(confirm).toContainText('no activities of their own');
  await expect(confirm).toContainText('not the main contact on any deal');
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No contacts match your search')).toBeVisible();
});

test('the status filter works together with search (C3)', async ({ page, request }) => {
  const all = await contacts(request);
  const customers = all.filter((c) => c.status === 'customer');
  await page.goto('/contacts');
  await page.getByRole('button', { name: /^Customers/ }).click();
  await expect(page.getByRole('button', { name: /^Customers/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(`Showing 1–${customers.length} of ${customers.length}`)).toBeVisible();
  const rows = page.getByRole('table', { name: 'Contacts' }).locator('tbody tr');
  for (const pill of await rows.locator('.pill').allInnerTexts()) expect(pill).toBe('Customer');

  const one = customers[0];
  const term = one.lastName.toLowerCase();
  const matches = (c: (typeof all)[number]) =>
    [`${c.firstName} ${c.lastName}`, c.email, c.organization?.name, c.jobTitle].some((f) => f?.toLowerCase().includes(term));
  await page.getByRole('searchbox', { name: 'Search contacts' }).fill(one.lastName);
  await expect(rows).toHaveCount(customers.filter(matches).length);

  // Switching the filter keeps the search.
  const leads = all.filter((c) => c.status === 'lead' && matches(c));
  await page.getByRole('button', { name: /^Leads/ }).click();
  if (leads.length === 0) await expect(page.getByText('No leads match your search')).toBeVisible();
  else await expect(rows).toHaveCount(leads.length);
});

test('a duplicate or malformed email is refused (C1)', async ({ page, request }) => {
  const taken = (await contacts(request)).find((c) => c.email)!;
  await page.goto('/contacts');
  await page.getByRole('button', { name: 'New contact' }).click();
  const form = page.getByRole('dialog', { name: 'New contact' });
  await form.getByLabel('First name').fill('Copy');
  await form.getByLabel('Last name').fill('Cat');
  await form.getByLabel('Email').fill('not-an-email');
  await form.getByRole('button', { name: 'Add contact' }).click();
  await expect(form.getByText('Enter a valid email address')).toBeVisible();
  await form.getByLabel('Email').fill(taken.email!.toUpperCase());
  await form.getByRole('button', { name: 'Add contact' }).click();
  await expect(form.getByText(`Already used by ${taken.firstName} ${taken.lastName}`)).toBeVisible();
  await expect(form.getByLabel('First name')).toHaveValue('Copy');
});

test("changing the organization of a deal's main contact asks first and unlinks the deal", async ({ page, request }) => {
  const deal = (await deals(request)).find((d) => d.contact)!;
  const other = (await organizations(request)).find((o) => o.id !== deal.organizationId)!;
  await page.goto(`/contacts/${deal.contactId}`);
  await page.getByRole('button', { name: 'Edit' }).click();
  const form = page.getByRole('dialog', { name: 'Edit contact' });
  await form.getByRole('combobox', { name: 'Organization' }).fill(other.name);
  await page.getByRole('option', { name: other.name }).click();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toContainText('leaves');
  await expect(form.getByRole('link', { name: deal.name })).toBeVisible();
  await form.getByRole('button', { name: /Save and remove from/ }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Contact saved/);
  await expect(page.getByRole('link', { name: other.name })).toBeVisible();

  await page.goto(`/deals/${deal.id}`);
  await expect(page.getByText('No main contact').first()).toBeVisible();
});

test('closing a changed form asks before discarding', async ({ page }) => {
  await page.goto('/contacts');
  await page.getByRole('button', { name: 'New contact' }).click();
  const form = page.getByRole('dialog', { name: 'New contact' });
  await form.getByLabel('First name').fill('Half');
  await page.keyboard.press('Escape');
  const ask = page.getByRole('alertdialog', { name: 'Discard your changes?' });
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await ask.getByRole('button', { name: 'Keep editing' }).click();
  await expect(form.getByLabel('First name')).toHaveValue('Half');
  await form.getByRole('button', { name: 'Cancel' }).click();
  await ask.getByRole('button', { name: 'Discard' }).click();
  await expect(form).toBeHidden();
  // A form with no changes closes straight away.
  await page.getByRole('button', { name: 'New contact' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

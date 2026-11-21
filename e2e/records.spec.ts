import { test, expect } from './fixtures';
import { deals, organizations } from './api';

test('each record page shows its linked records (O3, C4, D6)', async ({ page, request }) => {
  const deal = (await deals(request)).find((d) => d.contact)!;
  await page.goto(`/organizations/${deal.organizationId}`);
  await expect(page.getByRole('heading', { level: 1, name: deal.organization.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Deals' }).getByRole('link', { name: deal.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Contacts' }).getByRole('link', { name: deal.contact!.name })).toBeVisible();

  await page.getByRole('region', { name: 'Contacts' }).getByRole('link', { name: deal.contact!.name }).click();
  await expect(page.getByRole('heading', { level: 1, name: deal.contact!.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Details' }).getByRole('link', { name: deal.organization.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Deals' }).getByRole('link', { name: deal.name })).toBeVisible();

  await page.getByRole('region', { name: 'Deals' }).getByRole('link', { name: deal.name }).click();
  await expect(page.getByRole('heading', { level: 1, name: deal.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Details' }).getByRole('link', { name: deal.organization.name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Details' }).getByRole('link', { name: deal.contact!.name })).toBeVisible();
});

test('an activity logged on a deal shows on its contact too, and can be edited and deleted (A1–A4)', async ({ page, request }) => {
  const deal = (await deals(request)).find((d) => d.contact)!;
  await page.goto(`/deals/${deal.id}`);
  await page.getByRole('button', { name: 'Log activity' }).click();
  const form = page.getByRole('dialog', { name: 'Log activity' });
  await form.getByText('Call', { exact: true }).click();
  await form.getByLabel('Description').fill('Agreed the pilot scope');
  await expect(form.getByLabel(`Also show on ${deal.contact!.name}'s timeline`)).toBeChecked();
  await form.getByRole('button', { name: 'Log activity' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Activity logged/);
  const timeline = page.getByRole('list', { name: 'Timeline' });
  await expect(timeline.getByText('Agreed the pilot scope')).toBeVisible();
  await expect(timeline.locator('li').first()).toContainText('Agreed the pilot scope');

  await page.goto(`/contacts/${deal.contactId}`);
  const entry = page.getByRole('list', { name: 'Timeline' }).locator('li').filter({ hasText: 'Agreed the pilot scope' });
  await expect(entry).toBeVisible();
  await expect(entry.getByRole('link', { name: deal.name })).toBeVisible();

  await entry.getByRole('button', { name: 'Actions for Agreed the pilot scope' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit activity' });
  await edit.getByLabel('Description').fill('Agreed the pilot scope and timeline');
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('list', { name: 'Timeline' }).getByText('Agreed the pilot scope and timeline')).toBeVisible();

  const edited = page.getByRole('list', { name: 'Timeline' }).locator('li').filter({ hasText: 'Agreed the pilot scope and timeline' });
  await edited.getByRole('button', { name: /Actions for/ }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('dialog', { name: 'Delete this activity?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('list', { name: 'Timeline' }).getByText('Agreed the pilot scope and timeline')).toHaveCount(0);
});

test('a follow-up can be marked done and undone on a timeline (A6)', async ({ page, request }) => {
  const org = (await organizations(request))[0];
  await page.goto(`/organizations/${org.id}`);
  await page.getByRole('region', { name: 'Contacts' }).getByRole('link').first().click();
  await page.getByRole('button', { name: 'Log activity' }).click();
  const form = page.getByRole('dialog', { name: 'Log activity' });
  await form.getByLabel('Description').fill('Send the renewal quote');
  await form.getByLabel('Follow-up date').fill('2099-01-15');
  await form.getByRole('button', { name: 'Log activity' }).click();
  const entry = page.getByRole('list', { name: 'Timeline' }).locator('li').filter({ hasText: 'Send the renewal quote' });
  await expect(entry.locator('.pill')).toHaveText('Follow up Jan 15, 2099');
  await entry.getByRole('checkbox', { name: /Mark done/ }).check();
  await expect(entry.locator('.pill')).toHaveText('Done · Jan 15, 2099');
  await entry.getByRole('checkbox', { name: /Mark not done/ }).uncheck();
  await expect(entry.locator('.pill')).toHaveText('Follow up Jan 15, 2099');
});

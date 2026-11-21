import { test, expect, localToday } from './fixtures';
import { contacts, deals } from './api';

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const figure = (page: import('@playwright/test').Page, label: string) =>
  page.locator('.stat').filter({ has: page.getByText(label, { exact: true }) }).locator('.figure');

test('the dashboard shows every panel with sample data (B1–B7)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/follow-ups? overdue and \d+ deals? running late/)).toBeVisible();
  for (const label of ['Won this month', 'Deals won', 'Open pipeline', 'Expected revenue']) {
    await expect(figure(page, label)).not.toHaveText('0');
  }
  for (const title of ['Open pipeline by stage', 'Last 12 months', 'Follow-ups', 'Sales funnel', 'Recent activity']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(page.getByRole('tab', { name: /Overdue · 5/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /Due soon · 8/ })).toBeVisible();
  await expect(page.locator('.recent-entry')).toHaveCount(10);
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
  await page.getByRole('link', { name: 'Open board' }).click();
  await expect(page).toHaveURL(/\/pipeline$/);
});

test('a follow-up logged with a date shows on the dashboard and leaves when marked done (B6, A6)', async ({ page, request }) => {
  const contact = (await contacts(request))[0];
  await page.goto(`/contacts/${contact.id}`);
  await page.getByRole('button', { name: 'Log activity' }).click();
  const form = page.getByRole('dialog', { name: 'Log activity' });
  await form.getByLabel('Description').fill('Send the signed order form back');
  await form.getByLabel('Follow-up date').fill(addDays(localToday(), 2));
  await form.getByRole('button', { name: 'Log activity' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Activity logged/);

  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('tab', { name: /Due soon · 9/ }).click();
  const item = page.locator('.follow-up-card').filter({ hasText: 'Send the signed order form back' });
  await expect(item).toBeVisible();
  await expect(item.locator('.pill')).toContainText('Due');
  await expect(item.getByRole('link', { name: `${contact.firstName} ${contact.lastName}` })).toBeVisible();

  await item.getByRole('checkbox').check();
  await expect(item).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Due soon · 8/ })).toBeVisible();
});

test('winning a deal changes the figures, adds a recent entry and a stage change on its timeline (B1, B7, B8, D7)', async ({ page, request }) => {
  const deal = (await deals(request)).find((d) => d.stage === 'negotiation')!;
  await page.goto('/');
  const wonBefore = Number((await figure(page, 'Deals won').innerText()).replace(/\D/g, ''));
  const valueBefore = Number((await figure(page, 'Won this month').innerText()).replace(/\D/g, ''));

  await page.goto(`/deals/${deal.id}`);
  await page.getByRole('button', { name: 'Edit' }).click();
  const form = page.getByRole('dialog', { name: 'Edit deal' });
  await form.getByLabel('Stage').selectOption('won');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('toast')).toHaveText(/Deal saved/);
  const timeline = page.getByRole('list', { name: 'Timeline' });
  await expect(timeline.locator('li').first()).toContainText('Moved from Negotiation to Won');

  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(figure(page, 'Deals won')).toHaveText(String(wonBefore + 1));
  await expect(figure(page, 'Won this month')).toContainText((valueBefore + deal.value).toLocaleString('en-US'));
  const first = page.locator('.recent-entry').first();
  await expect(first).toContainText('Moved from Negotiation to Won');
  await expect(first.getByRole('link', { name: deal.name })).toBeVisible();
});

import { test, expect, localToday } from './fixtures';
import { deals } from './api';
import { column, columnIds, settled, dragCard } from './drag';

const money = (n: number) => `USD ${Math.round(n).toLocaleString('en-US')}`;

test('six columns with their totals, cards and the open totals (P1–P3)', async ({ page, request }) => {
  const all = await deals(request);
  const open = all.filter((d) => !['won', 'lost'].includes(d.stage));
  await page.goto('/pipeline');
  for (const stage of ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']) {
    await expect(page.getByRole('region', { name: stage, exact: true })).toBeVisible();
  }
  const totals = page.getByRole('definition');
  await expect(totals.nth(0)).toHaveText(money(open.reduce((a, d) => a + d.value, 0)));
  await expect(totals.nth(1)).toHaveText(money(open.reduce((a, d) => a + (d.value * d.probability) / 100, 0)));
  await expect(totals.nth(2)).toHaveText(String(open.length));
  const late = open.filter((d) => d.closeDate < localToday()).length;
  await expect(page.locator('.board-totals .pill-late')).toHaveText(`${late} late`);

  const news = all.filter((d) => d.stage === 'new');
  const head = column(page, 'new').locator('.column-head');
  await expect(head).toContainText(String(news.length));
  await expect(head).toContainText(money(news.reduce((a, d) => a + d.value, 0)));
  await expect(column(page, 'won').locator('.column-head')).toContainText('All time');
  await expect(column(page, 'lost').locator('.column-head')).toContainText('Not counted in totals');

  const first = news.sort((a, b) => a.position - b.position)[0];
  const card = page.locator(`[data-deal-id="${first.id}"]`);
  await expect(card).toContainText(first.name);
  await expect(card).toContainText(first.organization.name);
  await expect(card).toContainText(money(first.value));
  await expect(card).toContainText(`${first.probability}%`);
  const lateDeal = open.find((d) => d.closeDate < localToday())!;
  await expect(page.locator(`[data-deal-id="${lateDeal.id}"] .pill-late`)).toHaveText('Late');
});

test('Add deal in a column starts the deal at that stage, at the top (P6)', async ({ page }) => {
  await page.goto('/pipeline');
  await column(page, 'proposal').getByRole('button', { name: 'Add deal' }).click();
  const form = page.getByRole('dialog', { name: 'New deal' });
  await expect(form.getByLabel('Stage')).toHaveValue('proposal');
  await expect(form.getByLabel('Probability (%)')).toHaveValue('50');
  await form.getByLabel('Name').fill('Board-added deal');
  await form.getByRole('combobox', { name: 'Organization' }).fill('Halcyon');
  await page.getByRole('option', { name: 'Halcyon Media' }).click();
  await form.getByLabel('Value (USD)').fill('12000');
  await form.getByRole('button', { name: 'Add deal' }).click();
  await expect(column(page, 'proposal').locator('[data-deal-id]').first()).toContainText('Board-added deal');
});

test('board search filters cards but not totals (P8)', async ({ page }) => {
  await page.goto('/pipeline');
  const total = await page.getByRole('definition').first().innerText();
  await page.getByRole('searchbox', { name: 'Search deals on the board' }).fill('orbitra');
  for (const stage of ['new', 'qualified', 'proposal', 'negotiation'] as const) {
    for (const text of await column(page, stage).locator('.deal-card-org').allInnerTexts()) expect(text).toBe('Orbitra Software');
  }
  await expect(page.getByRole('definition').first()).toHaveText(total);
});

test("a moved deal's stage and probability show in the deals table", async ({ page, request }) => {
  const deal = (await deals(request)).filter((d) => d.stage === 'new').sort((a, b) => a.position - b.position)[0];
  await page.goto('/pipeline');
  await dragCard(page, deal.id, { stage: 'qualified', header: true });
  await settled(page);
  expect((await columnIds(page, 'qualified'))[0]).toBe(deal.id);
  await page.getByRole('link', { name: 'Deals', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search deals' }).fill(deal.name);
  const row = page.getByRole('table', { name: 'Deals' }).locator('tbody tr').filter({ hasText: deal.name }).first();
  await expect(row).toContainText('Qualified');
  await expect(row).toContainText('25%');
});

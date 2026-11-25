import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect, localToday, API_URL } from './fixtures';
import { deals, type DealRow } from './api';
import {
  card,
  column,
  columnIds,
  dragCard,
  keyboardMove,
  liveRegion,
  settled,
  showColumn,
  type StageKey,
} from './drag';

async function apiColumn(request: APIRequestContext, stage: StageKey): Promise<DealRow[]> {
  return (await deals(request)).filter((d) => d.stage === stage).sort((a, b) => a.position - b.position);
}
const ids = (rows: DealRow[]) => rows.map((d) => d.id);

async function openBoard(page: Page) {
  await page.goto('/pipeline');
  await expect(column(page, 'new').locator('[data-deal-id]').first()).toBeVisible();
}

/** After a refresh the board shows exactly what the server has. */
async function expectAfterRefresh(page: Page, stage: StageKey, expected: number[]) {
  await page.reload();
  await expect(
    column(page, stage).locator('[data-deal-id]').first().or(column(page, stage).locator('.column-empty')),
  ).toBeVisible();
  expect(await columnIds(page, stage)).toEqual(expected);
}

for (const width of [1280, 1024]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('within a column: down, up, to the top and to the end (case 1)', async ({ page, request }) => {
      await openBoard(page);
      const start = ids(await apiColumn(request, 'new'));
      const [a, b, c, d] = start;

      await dragCard(page, a, { stage: 'new', after: c });
      await settled(page);
      let expected = [b, c, a, d, ...start.slice(4)];
      expect(await columnIds(page, 'new')).toEqual(expected);

      await dragCard(page, d, { stage: 'new', before: b });
      await settled(page);
      expected = [d, b, c, a, ...start.slice(4)];
      expect(await columnIds(page, 'new')).toEqual(expected);

      await dragCard(page, a, { stage: 'new', header: true });
      await settled(page);
      expected = [a, d, b, c, ...start.slice(4)];
      expect(await columnIds(page, 'new')).toEqual(expected);

      await dragCard(page, b, { stage: 'new', end: true });
      await settled(page);
      expected = [a, d, c, ...start.slice(4), b];
      expect(await columnIds(page, 'new')).toEqual(expected);
      expect(ids(await apiColumn(request, 'new'))).toEqual(expected);
      await expectAfterRefresh(page, 'new', expected);
    });

    test('between columns: to the top, the middle and the end (case 2)', async ({ page, request }) => {
      await openBoard(page);
      const from = ids(await apiColumn(request, 'new'));
      const to = ids(await apiColumn(request, 'qualified'));

      await dragCard(page, from[0], { stage: 'qualified', header: true });
      await settled(page);
      await dragCard(page, from[1], { stage: 'qualified', after: to[1] });
      await settled(page);
      await dragCard(page, from[2], { stage: 'qualified', end: true });
      await settled(page);

      const expected = [from[0], to[0], to[1], from[1], ...to.slice(2), from[2]];
      expect(await columnIds(page, 'qualified')).toEqual(expected);
      expect(ids(await apiColumn(request, 'qualified'))).toEqual(expected);
      expect(ids(await apiColumn(request, 'new'))).toEqual(from.slice(3));
      const moved = (await deals(request)).find((d) => d.id === from[1])!;
      expect(moved).toMatchObject({ stage: 'qualified', probability: 25 });
      await expectAfterRefresh(page, 'qualified', expected);
    });
  });
}

test('a click opens the deal, and a small wobble while clicking is not a drag (case 5)', async ({ page, request }) => {
  await openBoard(page);
  const first = (await apiColumn(request, 'new'))[0];
  const box = (await card(page, first.id).boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 43, box.y + 32, { steps: 3 });
  await page.mouse.up();
  await expect(page).toHaveURL(new RegExp(`/deals/${first.id}$`));
  expect(ids(await apiColumn(request, 'new'))[0]).toBe(first.id);
});

test('keyboard: Space picks up, arrows move, Space drops, with announcements (case 11)', async ({ page, request }) => {
  await openBoard(page);
  const start = ids(await apiColumn(request, 'new'));
  const name = (await deals(request)).find((d) => d.id === start[0])!.name;
  await card(page, start[0]).focus();
  await page.keyboard.press('Space');
  await expect(liveRegion(page)).toHaveText(`Picked up ${name} in New`);
  await page.keyboard.press('ArrowDown');
  await expect(liveRegion(page)).toHaveText(`Over New, position 2 of ${start.length}`);
  await page.keyboard.press('Space');
  await expect(liveRegion(page)).toHaveText(`Moved ${name} to New, position 2`);
  await settled(page);
  const expected = [start[1], start[0], ...start.slice(2)];
  expect(ids(await apiColumn(request, 'new'))).toEqual(expected);
});

test('keyboard: to another column with the arrow keys (cases 2 and 11)', async ({ page, request }) => {
  await openBoard(page);
  const from = ids(await apiColumn(request, 'new'));
  const name = (await deals(request)).find((d) => d.id === from[0])!.name;
  await keyboardMove(page, from[0], ['ArrowRight']);
  await expect(liveRegion(page)).toHaveText(new RegExp(`^Moved ${name} to Qualified, position \\d+$`));
  await settled(page);
  const moved = (await deals(request)).find((d) => d.id === from[0])!;
  expect(moved).toMatchObject({ stage: 'qualified', probability: 25 });
  expect(await columnIds(page, 'qualified')).toContain(from[0]);
});

test('keyboard: Escape cancels and nothing is sent (cases 4 and 11)', async ({ page, request }) => {
  await openBoard(page);
  const start = ids(await apiColumn(request, 'new'));
  let moves = 0;
  page.on('request', (r) => /\/api\/deals\/\d+\/move$/.test(r.url()) && moves++);
  await card(page, start[0]).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(liveRegion(page)).toHaveText('Move cancelled');
  expect(await columnIds(page, 'new')).toEqual(start);
  expect(moves).toBe(0);
});

test('to an empty column (case 2)', async ({ page, request }) => {
  // Empty Negotiation first, through the API.
  for (const d of await apiColumn(request, 'negotiation')) {
    await request.post(`${API_URL}/api/deals/${d.id}/move`, { data: { stage: 'lost', index: 0, today: localToday() } });
  }
  await openBoard(page);
  await expect(column(page, 'negotiation').locator('.column-empty')).toHaveText('No deals');
  const id = ids(await apiColumn(request, 'proposal'))[0];
  await showColumn(page, 'negotiation');
  await dragCard(page, id, { stage: 'negotiation', empty: true });
  await settled(page);
  expect(await columnIds(page, 'negotiation')).toEqual([id]);
  expect((await deals(request)).find((d) => d.id === id)).toMatchObject({ stage: 'negotiation', probability: 75 });
  await expectAfterRefresh(page, 'negotiation', [id]);
});

test('into Won sets today and changes the totals; back out keeps the date (case 3)', async ({ page, request }) => {
  await page.setViewportSize({ width: 1700, height: 950 });
  await openBoard(page);
  const deal = (await apiColumn(request, 'negotiation'))[0];
  const totals = page.getByRole('definition').first();
  const before = await totals.innerText();
  const wonCount = column(page, 'won').locator('.column-title span');
  const wonBefore = Number(await wonCount.innerText());

  await dragCard(page, deal.id, { stage: 'won', header: true });
  // The totals change as soon as the card is dropped.
  await expect(wonCount).toHaveText(String(wonBefore + 1));
  await expect(totals).not.toHaveText(before);
  await settled(page);
  const won = (await deals(request)).find((d) => d.id === deal.id)!;
  expect(won).toMatchObject({ stage: 'won', probability: 100, closeDate: localToday() });
  expect((await columnIds(page, 'won'))[0]).toBe(deal.id);

  await dragCard(page, deal.id, { stage: 'proposal', header: true });
  await settled(page);
  const reopened = (await deals(request)).find((d) => d.id === deal.id)!;
  expect(reopened).toMatchObject({ stage: 'proposal', probability: 50, closeDate: localToday() });
  // Back among the open deals, the open pipeline value is what it was.
  await expect(totals).toHaveText(before);
  await expectAfterRefresh(page, 'proposal', ids(await apiColumn(request, 'proposal')));
});

test('dropping where it started, or outside every column, sends nothing (case 4)', async ({ page, request }) => {
  await openBoard(page);
  const start = ids(await apiColumn(request, 'new'));
  let moves = 0;
  page.on('request', (r) => /\/api\/deals\/\d+\/move$/.test(r.url()) && moves++);

  await dragCard(page, start[1], { stage: 'new', after: start[0] });
  await settled(page);
  expect(await columnIds(page, 'new')).toEqual(start);

  // Outside every column: above the board.
  const from = (await card(page, start[2]).boundingBox())!;
  await page.mouse.move(from.x + 50, from.y + 30);
  await page.mouse.down();
  await page.mouse.move(from.x + 70, from.y + 50, { steps: 4 });
  await page.mouse.move(from.x + 50, 60, { steps: 12 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(liveRegion(page)).toHaveText('Move cancelled');

  // Escape during a mouse drag.
  await dragCard(page, start[0], { stage: 'new', end: true }, { release: false });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await settled(page);
  expect(await columnIds(page, 'new')).toEqual(start);
  expect(moves).toBe(0);
  const changes = await (await request.get(`${API_URL}/api/deals/${start[1]}/timeline`)).json();
  expect(changes.filter((e: { kind: string }) => e.kind === 'stage_change')).toHaveLength(0);
});

test('with a search on, the card lands after the visible card above the drop place (case 6)', async ({
  page,
  request,
}) => {
  await openBoard(page);
  const all = await apiColumn(request, 'qualified');
  // Search by an organization with deals in both New and Qualified.
  const everything = await deals(request);
  const orgName = everything
    .filter((d) => d.stage === 'new')
    .map((d) => d.organization.name)
    .find((name) => everything.some((d) => d.stage === 'qualified' && d.organization.name === name))!;
  const term = orgName.split(' ')[0];
  await page.getByRole('searchbox', { name: 'Search deals on the board' }).fill(term);
  const visibleQualified = await columnIds(page, 'qualified');
  const visibleNew = await columnIds(page, 'new');
  expect(visibleNew.length).toBeGreaterThan(0);
  expect(visibleQualified.length).toBeGreaterThan(0);
  const moving = visibleNew[0];
  const above = visibleQualified[0];

  await dragCard(page, moving, { stage: 'qualified', after: above });
  await settled(page);
  const full = ids(await apiColumn(request, 'qualified'));
  expect(full[full.indexOf(above) + 1]).toBe(moving);
  expect(full).toHaveLength(all.length + 1);
  await page.reload();
  expect(await columnIds(page, 'qualified')).toEqual(full);
});

test('into Won with 10 showing, and after Show all (case 7)', async ({ page, request }) => {
  await page.setViewportSize({ width: 1700, height: 1300 });
  await openBoard(page);
  const won = ids(await apiColumn(request, 'won'));
  expect(won.length).toBeGreaterThan(10);
  await expect(column(page, 'won').locator('[data-deal-id]')).toHaveCount(10);
  await expect(column(page, 'won').getByRole('button', { name: `Show all ${won.length}` })).toBeVisible();

  const a = ids(await apiColumn(request, 'negotiation'))[0];
  await dragCard(page, a, { stage: 'won', end: true });
  await settled(page);
  // Below the 10th card it lands right after it, not at the very end of the column.
  let full = ids(await apiColumn(request, 'won'));
  expect(full.indexOf(a)).toBe(10);

  await column(page, 'won')
    .getByRole('button', { name: /Show all/ })
    .click();
  await expect(column(page, 'won').locator('[data-deal-id]')).toHaveCount(full.length);
  const b = ids(await apiColumn(request, 'negotiation'))[0];
  await dragCard(page, b, { stage: 'won', end: true });
  await settled(page);
  full = ids(await apiColumn(request, 'won'));
  expect(full[full.length - 1]).toBe(b);
});

test('two or three quick moves in a row are all saved, in order (case 8)', async ({ page, request }) => {
  await openBoard(page);
  const start = ids(await apiColumn(request, 'new'));
  const sent: string[] = [];
  page.on('request', (r) => {
    const m = r.url().match(/\/api\/deals\/(\d+)\/move$/);
    if (m) sent.push(m[1]);
  });
  // No waiting between moves.
  await dragCard(page, start[0], { stage: 'qualified', header: true });
  await dragCard(page, start[1], { stage: 'qualified', header: true });
  await dragCard(page, start[2], { stage: 'new', end: true });
  await settled(page);
  expect(sent).toEqual([String(start[0]), String(start[1]), String(start[2])]);
  const q = ids(await apiColumn(request, 'qualified'));
  expect(q.slice(0, 2)).toEqual([start[1], start[0]]);
  const n = ids(await apiColumn(request, 'new'));
  expect(n[n.length - 1]).toBe(start[2]);
  await expectAfterRefresh(page, 'qualified', q);
  expect(await columnIds(page, 'new')).toEqual(n);
});

test.describe('a move the server refuses (case 9)', () => {
  test.use({ allowedErrors: [/status of 500|^500$/] });

  test('reloads the board and says so', async ({ page, request }) => {
    await openBoard(page);
    const start = ids(await apiColumn(request, 'new'));
    const name = (await deals(request)).find((d) => d.id === start[0])!.name;
    await page.route('**/api/deals/*/move', (route) =>
      route.fulfill({ status: 500, json: { detail: 'Something went wrong' } }),
    );
    await dragCard(page, start[0], { stage: 'qualified', header: true });
    await expect(page.getByTestId('toast')).toHaveText(`Couldn't move ${name}. The board has been refreshed.`);
    await settled(page);
    expect(await columnIds(page, 'new')).toEqual(start);
    expect((await deals(request)).find((d) => d.id === start[0])!.stage).toBe('new');
  });
});

for (const width of [1280, 1024]) {
  test(`auto-scroll: dragging to a column off screen at ${width}px (case 12)`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await openBoard(page);
    const id = ids(await apiColumn(request, 'new'))[0];
    const board = page.locator('.board');
    expect(await board.evaluate((b) => b.scrollLeft)).toBe(0);
    await expect(column(page, 'lost')).not.toBeInViewport();
    const from = (await card(page, id).boundingBox())!;
    const edge = (await board.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 12, { steps: 3 });
    // Hold near the right edge until the board has scrolled to the end.
    await page.mouse.move(edge.x + edge.width - 10, from.y + 40, { steps: 15 });
    await expect
      .poll(() => board.evaluate((b) => b.scrollLeft + b.clientWidth >= b.scrollWidth - 2), { timeout: 8000 })
      .toBe(true);
    await dragCard(page, id, { stage: 'lost', header: true }, { release: false }).catch(() => {});
    await page.mouse.up();
    await settled(page);
    expect((await deals(request)).find((d) => d.id === id)!.stage).toBe('lost');
  });
}

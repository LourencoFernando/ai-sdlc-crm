import { expect, type Locator, type Page } from '@playwright/test';

export type StageKey = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const column = (page: Page, stage: StageKey) => page.locator(`section.column[data-stage="${stage}"]`);
export const card = (page: Page, id: number) => page.locator(`[data-deal-id="${id}"]`);

/** The deal ids a column shows, top to bottom. */
export async function columnIds(page: Page, stage: StageKey): Promise<number[]> {
  return column(page, stage)
    .locator('[data-deal-id]')
    .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-deal-id'))));
}

/** Scrolls the board sideways so a column is in view before a drag starts. */
export async function showColumn(page: Page, stage: StageKey): Promise<void> {
  await column(page, stage).evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
}

export type Target =
  | { stage: StageKey; before: number }
  | { stage: StageKey; after: number }
  | { stage: StageKey; header: true }
  | { stage: StageKey; empty: true }
  | { stage: StageKey; end: true };

async function center(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

const GAP = 8;

/** The height of the card being dragged (its overlay copy), or of the card itself before the drag. */
async function draggedHeight(page: Page, id: number): Promise<number> {
  const overlay = page.locator('.lifted');
  const box = (await overlay.count()) ? await overlay.first().boundingBox() : await card(page, id).boundingBox();
  return box!.height;
}

/**
 * The point to let go of the mouse for a target: the middle of the slot the card should end up in,
 * measured on the board as it looks now, which is where a person aims.
 */
async function targetPoint(page: Page, target: Target, id: number) {
  const col = column(page, target.stage);
  if ('before' in target) {
    const { x, box } = await center(card(page, target.before));
    return { x, y: box.y - GAP - (await draggedHeight(page, id)) / 2 + 4 };
  }
  if ('after' in target) {
    const { x, box } = await center(card(page, target.after));
    return { x, y: box.y + box.height + GAP + (await draggedHeight(page, id)) / 2 - 4 };
  }
  if ('header' in target) return (await center(col.locator('.column-head'))) as { x: number; y: number };
  const head = (await col.locator('.column-head').boundingBox())!;
  const cards = col.locator('[data-deal-id]');
  const count = await cards.count();
  if ('empty' in target || count === 0) return { x: head.x + head.width / 2, y: head.y + head.height + 60 };
  const last = (await cards.nth(count - 1).boundingBox())!;
  return { x: last.x + last.width / 2, y: last.y + last.height + 40 };
}

/** Drags a card with real mouse steps: press, move past 6px, travel, settle, release. */
export async function dragCard(page: Page, id: number, target: Target, options: { release?: boolean } = {}): Promise<void> {
  const from = await center(card(page, id));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 4, from.y + 4, { steps: 2 });
  await page.mouse.move(from.x + 12, from.y + 12, { steps: 3 });
  // Hold near the top or bottom edge while the target is out of view, so the page scrolls to it.
  const height = page.viewportSize()!.height;
  let to = await targetPoint(page, target, id);
  for (let i = 0; i < 60 && (to.y > height - 12 || to.y < 12); i++) {
    await page.mouse.move(to.x, to.y > height - 12 ? height - 16 : 16, { steps: 4 });
    await page.waitForTimeout(150);
    to = await targetPoint(page, target, id);
  }
  await page.mouse.move(to.x, to.y, { steps: 18 });
  // Cards slide aside while dragging, so aim again at where the target is now, as a person would,
  // until it stops moving.
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(140);
    const next = await targetPoint(page, target, id);
    if (Math.abs(next.x - to.x) < 2 && Math.abs(next.y - to.y) < 2) break;
    to = next;
    await page.mouse.move(to.x, to.y, { steps: 6 });
  }
  await page.mouse.move(to.x, to.y + 1);
  await page.waitForTimeout(60);
  if (options.release !== false) await page.mouse.up();
}

/** Waits until every move sent so far has been answered. */
export async function settled(page: Page): Promise<void> {
  await expect(page.locator('.board')).not.toHaveAttribute('data-dragging');
  await expect(page.locator('.pipeline-page')).not.toHaveAttribute('data-busy', { timeout: 10_000 });
}

/** Picks a card up with Space, presses arrow keys, and drops it with Space (P7). */
export async function keyboardMove(page: Page, id: number, keys: string[]): Promise<void> {
  await card(page, id).focus();
  await page.keyboard.press('Space');
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }
  await page.keyboard.press('Space');
}

export const liveRegion = (page: Page) => page.locator('[id^="DndLiveRegion"]');

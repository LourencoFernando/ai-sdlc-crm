import type { Deal, MoveResult } from '../api/types';
import { isLate } from './dates';
import { isOpenStage, STAGES, type Stage } from './stages';

/**
 * The board's pure logic: grouping, totals, search, moving a card, and turning a drop in a
 * filtered or shortened list into an index in the full column (P4, P5, P8, P9, P11).
 */

export type Board = Record<Stage, Deal[]>;

export const COMPACT_LIMIT = 10;

const byPosition = (a: Deal, b: Deal) => a.position - b.position || a.id - b.id;

export function buildBoard(deals: Deal[]): Board {
  const board = Object.fromEntries(STAGES.map((s) => [s, [] as Deal[]])) as Board;
  for (const d of deals) board[d.stage].push(d);
  for (const s of STAGES) board[s].sort(byPosition);
  return board;
}

export interface Totals {
  count: number;
  value: number;
  expected: number;
}

export function columnTotals(cards: Deal[]): Totals {
  return cards.reduce(
    (t, d) => ({
      count: t.count + 1,
      value: t.value + d.value,
      expected: t.expected + (d.value * d.probability) / 100,
    }),
    { count: 0, value: 0, expected: 0 },
  );
}

/** The board's totals count open deals only: Won and Lost are left out (P2). */
export function openTotals(deals: Deal[], today: string): Totals & { late: number } {
  const open = deals.filter((d) => isOpenStage(d.stage));
  return { ...columnTotals(open), late: open.filter((d) => isLate(d, today)).length };
}

/** Search by deal name, organization or contact (P8). It filters cards, never totals. */
export function matchesCard(deal: Deal, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [deal.name, deal.organization.name, deal.contact?.name].some((f) => f?.toLowerCase().includes(q));
}

/** The cards a column shows: those matching the search and, for Won and Lost, the first 10 unless expanded. */
export function visibleCards(cards: Deal[], query: string, compact: boolean, expanded: boolean): Deal[] {
  const matching = cards.filter((d) => matchesCard(d, query));
  return compact && !expanded ? matching.slice(0, COMPACT_LIMIT) : matching;
}

/**
 * Where a drop lands in the full column: right after the visible card above the drop place,
 * or at the top when there's none (P11). `visibleAfterDrop` is the column's visible ids in their
 * new order, including the moving card; `fullColumn` is the target column's full order.
 */
export function fullIndexFromVisible(fullColumn: number[], visibleAfterDrop: number[], movingId: number): number {
  const rest = fullColumn.filter((id) => id !== movingId);
  const at = visibleAfterDrop.indexOf(movingId);
  if (at <= 0) return 0;
  const above = visibleAfterDrop[at - 1];
  const index = rest.indexOf(above);
  return index === -1 ? rest.length : index + 1;
}

export interface MoveRules {
  probabilityOf: (stage: Stage) => number;
  today: string;
}

/**
 * Moves a card to `index` in `toStage`'s full column. The stage rules apply when the stage changes:
 * the new stage's probability, and today's close date on Won or Lost (D2, D3). Positions are
 * renumbered from 0 in both columns. Dropping where it started changes nothing.
 */
export function moveCard(
  deals: Deal[],
  dealId: number,
  toStage: Stage,
  index: number,
  rules: MoveRules,
): { deals: Deal[]; changed: boolean } {
  const moving = deals.find((d) => d.id === dealId);
  if (!moving) return { deals, changed: false };
  const board = buildBoard(deals);
  const from = board[moving.stage].map((d) => d.id);
  const target = (toStage === moving.stage ? from : board[toStage].map((d) => d.id)).filter((id) => id !== dealId);
  const at = Math.max(0, Math.min(index, target.length));
  target.splice(at, 0, dealId);
  if (toStage === moving.stage && target.every((id, i) => id === from[i])) return { deals, changed: false };

  const fromOrder = toStage === moving.stage ? target : from.filter((id) => id !== dealId);
  const position = new Map<number, number>();
  fromOrder.forEach((id, i) => position.set(id, i));
  target.forEach((id, i) => position.set(id, i));

  const next = deals.map((d) => {
    const p = position.get(d.id);
    if (d.id === dealId) {
      const stageChanged = toStage !== d.stage;
      const closing = stageChanged && (toStage === 'won' || toStage === 'lost');
      return {
        ...d,
        stage: toStage,
        position: p!,
        probability: stageChanged ? rules.probabilityOf(toStage) : d.probability,
        closeDate: closing ? rules.today : d.closeDate,
      };
    }
    return p === undefined || p === d.position ? d : { ...d, position: p };
  });
  return { deals: next, changed: true };
}

/** Takes the server's answer to a move as the truth for the deal and both columns (P13). */
export function applyMoveResult(deals: Deal[], result: MoveResult): Deal[] {
  const position = new Map<number, number>();
  for (const ids of Object.values(result.columns)) ids?.forEach((id, i) => position.set(id, i));
  return deals.map((d) => {
    if (d.id === result.deal.id) return result.deal;
    const p = position.get(d.id);
    return p === undefined || p === d.position ? d : { ...d, position: p };
  });
}

import { describe, expect, it } from 'vitest';
import type { Deal } from '../api/types';
import {
  applyMoveResult,
  buildBoard,
  columnTotals,
  fullIndexFromVisible,
  matchesCard,
  moveCard,
  openTotals,
  visibleCards,
} from './pipeline';
import type { Stage } from './stages';

const probs: Record<Stage, number> = { new: 10, qualified: 25, proposal: 50, negotiation: 75, won: 100, lost: 0 };
const rules = { probabilityOf: (s: Stage) => probs[s], today: '2026-11-20' };

let nextId = 1;
function deal(stage: Stage, position: number, value = 10_000, extra: Partial<Deal> = {}): Deal {
  const id = nextId++;
  return {
    id,
    name: `Deal ${id}`,
    organizationId: 1,
    organization: { id: 1, name: 'Acme' },
    contactId: null,
    contact: null,
    stage,
    value,
    probability: probs[stage],
    closeDate: '2026-12-31',
    position,
    createdAt: '',
    updatedAt: '',
    ...extra,
  };
}

function sample() {
  nextId = 1;
  return [
    deal('new', 0),
    deal('new', 1),
    deal('new', 2),
    deal('new', 3), // 1..4
    deal('qualified', 0, 20_000),
    deal('qualified', 1, 20_000), // 5, 6
    deal('won', 0, 50_000, { closeDate: '2026-11-02' }), // 7
    deal('lost', 0, 8_000), // 8
  ];
}
const order = (deals: Deal[], stage: Stage) => buildBoard(deals)[stage].map((d) => d.id);

describe('moving a card', () => {
  it('moves within a column, up, down, to the top and to the end', () => {
    const deals = sample();
    expect(order(moveCard(deals, 3, 'new', 1, rules).deals, 'new')).toEqual([1, 3, 2, 4]);
    expect(order(moveCard(deals, 1, 'new', 2, rules).deals, 'new')).toEqual([2, 3, 1, 4]);
    expect(order(moveCard(deals, 4, 'new', 0, rules).deals, 'new')).toEqual([4, 1, 2, 3]);
    expect(order(moveCard(deals, 1, 'new', 3, rules).deals, 'new')).toEqual([2, 3, 4, 1]);
  });

  it('gives no move when dropped where it started', () => {
    const deals = sample();
    const r = moveCard(deals, 2, 'new', 1, rules);
    expect(r.changed).toBe(false);
    expect(r.deals).toBe(deals);
  });

  it('moves between columns to the top, middle, end and an empty column, renumbering both', () => {
    const deals = sample();
    let r = moveCard(deals, 2, 'qualified', 0, rules);
    expect(order(r.deals, 'qualified')).toEqual([2, 5, 6]);
    expect(order(r.deals, 'new')).toEqual([1, 3, 4]);
    expect(buildBoard(r.deals).new.map((d) => d.position)).toEqual([0, 1, 2]);
    expect(buildBoard(r.deals).qualified.map((d) => d.position)).toEqual([0, 1, 2]);
    r = moveCard(deals, 2, 'qualified', 1, rules);
    expect(order(r.deals, 'qualified')).toEqual([5, 2, 6]);
    r = moveCard(deals, 2, 'qualified', 9, rules);
    expect(order(r.deals, 'qualified')).toEqual([5, 6, 2]);
    r = moveCard(deals, 2, 'proposal', 0, rules);
    expect(order(r.deals, 'proposal')).toEqual([2]);
  });

  it('applies the stage probability, and today as close date into Won or Lost (D2, D3)', () => {
    const deals = sample();
    let moved = moveCard(deals, 1, 'negotiation', 0, rules).deals.find((d) => d.id === 1)!;
    expect(moved).toMatchObject({ stage: 'negotiation', probability: 75, closeDate: '2026-12-31' });
    moved = moveCard(deals, 1, 'won', 0, rules).deals.find((d) => d.id === 1)!;
    expect(moved).toMatchObject({ stage: 'won', probability: 100, closeDate: '2026-11-20' });
    // Out of Won keeps the close date.
    moved = moveCard(deals, 7, 'proposal', 0, rules).deals.find((d) => d.id === 7)!;
    expect(moved).toMatchObject({ stage: 'proposal', probability: 50, closeDate: '2026-11-02' });
  });

  it('keeps a hand-set probability when moving within a column', () => {
    const deals = sample();
    deals[0].probability = 33;
    expect(moveCard(deals, 1, 'new', 2, rules).deals.find((d) => d.id === 1)!.probability).toBe(33);
  });

  it('leaves untouched cards as the same objects, so they need no redraw', () => {
    const deals = sample();
    const r = moveCard(deals, 1, 'new', 1, rules);
    expect(r.deals.find((d) => d.id === 5)).toBe(deals.find((d) => d.id === 5));
  });
});

describe('the index in the full column (P8, P9, P11)', () => {
  it('lands right after the visible card above the drop place', () => {
    // Full column 1..6; a search shows 2, 4 and 6. Dropping 9 between 4 and 6 puts it after 4.
    expect(fullIndexFromVisible([1, 2, 3, 4, 5, 6], [2, 4, 9, 6], 9)).toBe(4);
    // At the top of the visible list it goes to the top.
    expect(fullIndexFromVisible([1, 2, 3, 4, 5, 6], [9, 2, 4, 6], 9)).toBe(0);
    // Below the last visible card, it goes right after it, not to the very end.
    expect(fullIndexFromVisible([1, 2, 3, 4, 5, 6], [2, 4, 6, 9], 9)).toBe(6);
    expect(fullIndexFromVisible([1, 2, 3, 4, 5, 6, 7], [2, 4, 6, 9], 9)).toBe(6);
  });

  it('works within the same column when the card was already in it', () => {
    // Full 1..5, visible 1, 3, 5. Moving 5 up between 1 and 3 puts it right after 1.
    expect(fullIndexFromVisible([1, 2, 3, 4, 5], [1, 5, 3], 5)).toBe(1);
  });

  it('uses the first 10 of Won or Lost the same way', () => {
    const full = Array.from({ length: 26 }, (_, i) => i + 1);
    const visible = full.slice(0, 10);
    expect(fullIndexFromVisible(full, [...visible, 99], 99)).toBe(10);
    expect(fullIndexFromVisible(full, [1, 99, ...visible.slice(1)], 99)).toBe(1);
  });

  it('is 0 in an empty column', () => {
    expect(fullIndexFromVisible([], [9], 9)).toBe(0);
  });
});

describe('totals (P1, P2, P5)', () => {
  it('counts each column, and only open deals on the board', () => {
    const deals = sample();
    const board = buildBoard(deals);
    expect(columnTotals(board.new)).toEqual({ count: 4, value: 40_000, expected: 4_000 });
    expect(columnTotals(board.won)).toEqual({ count: 1, value: 50_000, expected: 50_000 });
    expect(openTotals(deals, '2026-11-20')).toEqual({ count: 6, value: 80_000, expected: 14_000, late: 0 });
  });

  it('change with every kind of move', () => {
    const deals = sample();
    const within = moveCard(deals, 1, 'new', 3, rules).deals;
    expect(openTotals(within, '2026-11-20')).toEqual(openTotals(deals, '2026-11-20'));
    const across = moveCard(deals, 1, 'negotiation', 0, rules).deals;
    expect(openTotals(across, '2026-11-20')).toEqual({ count: 6, value: 80_000, expected: 20_500, late: 0 });
    const won = moveCard(deals, 1, 'won', 0, rules).deals;
    expect(openTotals(won, '2026-11-20')).toEqual({ count: 5, value: 70_000, expected: 13_000, late: 0 });
    expect(columnTotals(buildBoard(won).won)).toEqual({ count: 2, value: 60_000, expected: 60_000 });
    const reopened = moveCard(deals, 8, 'proposal', 0, rules).deals;
    expect(openTotals(reopened, '2026-11-20').count).toBe(7);
  });

  it('counts late open deals', () => {
    const deals = sample();
    deals[0].closeDate = '2026-11-01';
    deals[6].closeDate = '2025-01-01';
    expect(openTotals(deals, '2026-11-20').late).toBe(1);
  });
});

describe('board search (P8)', () => {
  it('filters cards by name, organization or contact, ignoring case, but not totals', () => {
    const deals = sample();
    deals[1] = { ...deals[1], name: 'Fleet telematics' };
    deals[2] = { ...deals[2], contact: { id: 3, name: 'Dana Reyes' } };
    expect(matchesCard(deals[1], 'FLEET')).toBe(true);
    expect(matchesCard(deals[2], 'reyes')).toBe(true);
    expect(matchesCard(deals[0], 'acme')).toBe(true);
    expect(matchesCard(deals[0], 'zzz')).toBe(false);
    const board = buildBoard(deals);
    expect(visibleCards(board.new, 'fleet', false, false).map((d) => d.id)).toEqual([2]);
    expect(openTotals(deals, '2026-11-20').count).toBe(6);
  });

  it('shows the first 10 of a compact column until expanded', () => {
    const many = Array.from({ length: 14 }, (_, i) => deal('won', i));
    expect(visibleCards(many, '', true, false)).toHaveLength(10);
    expect(visibleCards(many, '', true, true)).toHaveLength(14);
  });
});

describe("taking the server's answer", () => {
  it('uses its deal and its order for both columns', () => {
    const deals = sample();
    const optimistic = moveCard(deals, 1, 'qualified', 1, rules).deals;
    const serverDeal = { ...optimistic.find((d) => d.id === 1)!, probability: 25, position: 2 };
    const result = applyMoveResult(optimistic, { deal: serverDeal, columns: { new: [2, 3, 4], qualified: [5, 6, 1] } });
    expect(order(result, 'qualified')).toEqual([5, 6, 1]);
    expect(order(result, 'new')).toEqual([2, 3, 4]);
  });
});

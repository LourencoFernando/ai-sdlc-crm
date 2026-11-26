import { describe, expect, it } from 'vitest';
import type { ClientRect, UniqueIdentifier } from '@dnd-kit/core';
import type { Stage } from '../../lib/stages';
import { createKeyboardCoordinates } from './drop-detection';

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// New has cards 1 and 2, Qualified has card 3, Proposal is empty.
const items: Record<Stage, UniqueIdentifier[]> = {
  new: [1, 2],
  qualified: [3],
  proposal: [],
  negotiation: [],
  won: [],
  lost: [],
};
const rects = new Map<UniqueIdentifier, ClientRect>([
  [1, rect(0, 110, 280, 120)],
  [2, rect(0, 240, 280, 120)],
  [3, rect(300, 110, 280, 120)],
  ['column:proposal', rect(600, 0, 280, 800)],
  ['header:proposal', rect(600, 0, 280, 100)],
]);
const coordinates = createKeyboardCoordinates(() => items);

function press(
  code: string,
  activeId: UniqueIdentifier | null,
  collisionRect: ClientRect | null = rect(0, 0, 280, 120),
) {
  const event = new KeyboardEvent('keydown', { code, cancelable: true });
  const context = {
    active: activeId === null ? null : { id: activeId },
    droppableRects: rects,
    collisionRect,
  };
  return coordinates(event, { active: activeId ?? 0, currentCoordinates: { x: 0, y: 0 }, context } as never);
}

describe('keyboard moves between columns', () => {
  it('moves right to the same place in the next column, or its last card', () => {
    expect(press('ArrowRight', 1)).toEqual({ x: 300, y: 110 });
    expect(press('ArrowRight', 2)).toEqual({ x: 300, y: 110 });
  });

  it('moves into an empty column below its header', () => {
    expect(press('ArrowRight', 3)).toEqual({ x: 600, y: 116 });
  });

  it('moves left to the previous column', () => {
    expect(press('ArrowLeft', 3)).toEqual({ x: 0, y: 110 });
  });

  it('goes nowhere past the first column or without a card', () => {
    expect(press('ArrowLeft', 1)).toBeUndefined();
    expect(press('ArrowRight', null)).toBeUndefined();
    expect(press('ArrowRight', 1, null)).toBeUndefined();
    expect(press('ArrowRight', 99)).toBeUndefined();
  });

  it('goes nowhere when the next column is not measured', () => {
    const unmeasured = createKeyboardCoordinates(() => ({ ...items, qualified: [], new: [1] }));
    const event = new KeyboardEvent('keydown', { code: 'ArrowRight' });
    const context = { active: { id: 1 }, droppableRects: new Map(), collisionRect: rect(0, 0, 1, 1) };
    expect(unmeasured(event, { active: 1, currentCoordinates: { x: 0, y: 0 }, context } as never)).toBeUndefined();
  });
});

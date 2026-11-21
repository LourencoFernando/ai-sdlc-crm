import { describe, expect, it } from 'vitest';
import type { ClientRect, DroppableContainer, UniqueIdentifier } from '@dnd-kit/core';
import { createDropDetection, insertIndex } from './drop-detection';
import type { Stage } from '../../lib/stages';

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// Two columns side by side: New (x 0–280) with two cards, Qualified (x 300–580) empty.
const rects = new Map<UniqueIdentifier, ClientRect>([
  ['column:new', rect(0, 0, 280, 800)],
  ['header:new', rect(0, 0, 280, 100)],
  [1, rect(0, 110, 280, 120)],
  [2, rect(0, 240, 280, 120)],
  ['column:qualified', rect(300, 0, 280, 800)],
  ['header:qualified', rect(300, 0, 280, 100)],
]);
const items: Record<Stage, UniqueIdentifier[]> = { new: [1, 2], qualified: [], proposal: [], negotiation: [], won: [], lost: [] };
const containers = [...rects.keys()].map(
  (id) => ({ id, rect: { current: rects.get(id)! }, key: String(id), data: { current: {} }, disabled: false, node: { current: null } }) as unknown as DroppableContainer,
);
const detect = createDropDetection(() => items);

function at(x: number, y: number) {
  return detect({
    active: { id: 99, rect: { current: { initial: null, translated: null } }, data: { current: {} } } as never,
    collisionRect: rect(x - 140, y - 60, 280, 120),
    droppableRects: rects,
    droppableContainers: containers,
    pointerCoordinates: { x, y },
  })[0]?.id;
}

describe('drop detection', () => {
  it('lands in an empty column', () => {
    expect(at(440, 500)).toBe('column:qualified');
    expect(insertIndex(items.qualified, 'column:qualified', 440, null)).toBe(0);
  });

  it('goes to the top over a header', () => {
    expect(at(140, 50)).toBe('header:new');
    expect(insertIndex(items.new, 'header:new', 0, null)).toBe(0);
  });

  it('goes after the last card below it', () => {
    expect(at(140, 700)).toBe(2);
    expect(insertIndex(items.new, 2, 640, rects.get(2)!)).toBe(2);
  });

  it('goes before or after the card it is over', () => {
    expect(at(140, 150)).toBe(1);
    expect(insertIndex(items.new, 1, 100, rects.get(1)!)).toBe(0);
    expect(insertIndex(items.new, 1, 200, rects.get(1)!)).toBe(1);
  });

  it('has no target outside every column, so the drop cancels', () => {
    expect(at(290, 400)).toBeUndefined();
    expect(at(900, 400)).toBeUndefined();
  });
});

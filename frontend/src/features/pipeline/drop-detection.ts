import { closestCenter, type CollisionDetection, type KeyboardCoordinateGetter, type UniqueIdentifier } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { STAGES, type Stage } from '../../lib/stages';

/**
 * Droppable ids: a card is its deal id (a number); each column has a header (`header:won`)
 * and a body covering the whole column (`column:won`), so an empty column is still a target.
 */
export const headerId = (stage: Stage) => `header:${stage}`;
export const columnId = (stage: Stage) => `column:${stage}`;

export function stageOfDroppable(id: UniqueIdentifier): Stage | null {
  const s = String(id);
  const stage = s.slice(s.indexOf(':') + 1) as Stage;
  return (s.startsWith('header:') || s.startsWith('column:')) && STAGES.includes(stage) ? stage : null;
}

export const isHeader = (id: UniqueIdentifier) => String(id).startsWith('header:');
export const isColumn = (id: UniqueIdentifier) => String(id).startsWith('column:');

/**
 * First the column under the pointer, then the closest card inside it (P11). Over a header the
 * answer is the header (the top); in a column with no cards, the column itself. Outside every
 * column there's no target, so dropping there cancels. The keyboard has no pointer, so the
 * dragged card's center stands in for it, and the same rule applies.
 */
export function createDropDetection(itemsOf: () => Record<Stage, UniqueIdentifier[]>): CollisionDetection {
  return (args) => {
    const all = args.droppableContainers;
    const r = args.collisionRect;
    const point = args.pointerCoordinates ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const containing = (match: (id: UniqueIdentifier) => boolean) =>
      all.find((c) => {
        const rect = args.droppableRects.get(c.id);
        return match(c.id) && rect && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
      });
    const header = containing(isHeader);
    if (header) return [{ id: header.id, data: { droppableContainer: header, value: 0 } }];
    const column = containing(isColumn);
    if (!column) return [];
    const stage = stageOfDroppable(column.id)!;
    const ids = itemsOf()[stage];
    const cards = all.filter((c) => ids.includes(c.id));
    if (cards.length === 0) return [{ id: column.id, data: { droppableContainer: column, value: 0 } }];
    return closestCenter({ ...args, droppableContainers: cards });
  };
}

/**
 * Left and Right move a picked-up card to the same place in the next column (or into it when
 * it's empty); Up and Down move it within its column (P7).
 */
export function createKeyboardCoordinates(itemsOf: () => Record<Stage, UniqueIdentifier[]>): KeyboardCoordinateGetter {
  return (event, args) => {
    if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return sortableKeyboardCoordinates(event, args);
    event.preventDefault();
    const { active, droppableRects, collisionRect } = args.context;
    if (!active || !collisionRect) return undefined;
    const items = itemsOf();
    const from = STAGES.find((s) => items[s].includes(active.id));
    if (!from) return undefined;
    const to = STAGES[STAGES.indexOf(from) + (event.code === 'ArrowRight' ? 1 : -1)];
    if (!to) return undefined;
    const index = Math.min(items[from].indexOf(active.id), items[to].length - 1);
    const targetRect = index >= 0 ? droppableRects.get(items[to][index]) : null;
    if (targetRect) return { x: targetRect.left, y: targetRect.top };
    const column = droppableRects.get(columnId(to));
    const header = droppableRects.get(headerId(to));
    if (!column) return undefined;
    return { x: column.left, y: (header?.bottom ?? column.top) + 16 };
  };
}

/**
 * Where a card coming from another column goes in this one's visible list: the top over the
 * header, the end over the empty space, otherwise before or after the card it's over, depending on
 * which half of that card the dragged card's center is in.
 */
export function insertIndex(
  overItems: UniqueIdentifier[],
  overId: UniqueIdentifier,
  draggedCenterY: number | null,
  overRect: { top: number; height: number } | null,
): number {
  if (isHeader(overId)) return 0;
  if (isColumn(overId)) return overItems.length;
  const overIndex = overItems.indexOf(overId);
  if (overIndex === -1) return overItems.length;
  const below = draggedCenterY !== null && overRect !== null && draggedCenterY > overRect.top + overRect.height / 2;
  return overIndex + (below ? 1 : 0);
}

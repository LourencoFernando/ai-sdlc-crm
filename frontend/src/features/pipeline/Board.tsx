import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Deal } from '../../api/types';
import { buildBoard, columnTotals, fullIndexFromVisible, matchesCard, moveCard, visibleCards } from '../../lib/pipeline';
import { STAGES, type Stage } from '../../lib/stages';
import { Column } from './Column';
import { DealCardView } from './DealCard';
import { createDropDetection, createKeyboardCoordinates, insertIndex, isColumn, isHeader, stageOfDroppable } from './drop-detection';
import { createAnnouncements, screenReaderInstructions } from './announcements';
import type { Move } from './move-queue';
import { noteDragEnd, noteDragStart } from './drag-click';

type Items = Record<Stage, number[]>;
const COMPACT: Stage[] = ['won', 'lost'];

/**
 * The board and its drag layer. During a drag only a local copy of the visible card ids changes;
 * on drop, `lib/pipeline.ts` works out the new board and the index in the full column, and that one
 * result updates the screen, the totals and the request (P4, P5, P10–P14).
 */
export function Board({
  deals,
  search,
  today,
  probabilityOf,
  onMove,
  onAddDeal,
}: {
  deals: Deal[];
  search: string;
  today: string;
  probabilityOf: (stage: Stage) => number;
  onMove: (move: Move, optimistic: Deal[]) => void;
  onAddDeal: (stage: Stage) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const board = useMemo(() => buildBoard(deals), [deals]);
  const byId = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  const visible = useMemo(() => {
    const v = {} as Record<Stage, Deal[]>;
    for (const s of STAGES) v[s] = visibleCards(board[s], search, COMPACT.includes(s), !!expanded[s]);
    return v;
  }, [board, search, expanded]);

  // The drag layer's local copy: the visible ids per column, changed as the card moves over columns.
  const [dragItems, setDragItems] = useState<Items | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  // The overlay keeps the look of the card that was picked up, so it stays centered under the pointer.
  const [activeCompact, setActiveCompact] = useState(false);
  const items: Items = useMemo(
    () => dragItems ?? (Object.fromEntries(STAGES.map((s) => [s, visible[s].map((d) => d.id)])) as Items),
    [dragItems, visible],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const where = useRef<{ stage: Stage; position: number; of: number } | null>(null);

  const containerOf = useCallback((id: UniqueIdentifier, from: Items = itemsRef.current): Stage | null => {
    const stage = stageOfDroppable(id);
    if (stage) return stage;
    return STAGES.find((s) => from[s].includes(Number(id))) ?? null;
  }, []);

  const keyboardCoordinates = useMemo(() => createKeyboardCoordinates(() => itemsRef.current), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );
  const detection = useMemo(() => createDropDetection(() => itemsRef.current), []);
  const announcements = useMemo(
    () =>
      createAnnouncements(
        (id) => {
          const d = byId.get(id);
          return d && { name: d.name, stage: d.stage };
        },
        () => where.current,
      ),
    [byId],
  );

  function noteWhere(list: Items, id: number) {
    const stage = containerOf(id, list);
    if (!stage) {
      where.current = null;
      return;
    }
    where.current = { stage, position: list[stage].indexOf(id) + 1, of: list[stage].length };
  }

  function onDragStart({ active }: DragStartEvent) {
    noteDragStart();
    const id = Number(active.id);
    setActiveId(id);
    setActiveCompact(COMPACT.includes(containerOf(id) ?? 'new'));
    setDragItems(items);
    noteWhere(items, id);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) {
      where.current = null;
      return;
    }
    const id = Number(active.id);
    const current = itemsRef.current;
    const from = containerOf(id, current);
    const to = containerOf(over.id, current);
    if (!from || !to) return;
    let next = current;
    if (from !== to) {
      // Into another column: open a place before or after the card it's over.
      const dragged = active.rect.current.translated;
      const index = insertIndex(current[to], over.id, dragged ? dragged.top + dragged.height / 2 : null, over.rect);
      const target = current[to].filter((x) => x !== id);
      target.splice(Math.min(index, target.length), 0, id);
      next = { ...current, [from]: current[from].filter((x) => x !== id), [to]: target };
      setDragItems(next);
      itemsRef.current = next;
    } else if (!isHeader(over.id) && !isColumn(over.id)) {
      const oldIndex = current[to].indexOf(id);
      const newIndex = current[to].indexOf(Number(over.id));
      if (oldIndex !== newIndex) next = { ...current, [to]: arrayMove(current[to], oldIndex, newIndex) };
    } else if (isHeader(over.id)) {
      next = { ...current, [to]: [id, ...current[to].filter((x) => x !== id)] };
    }
    noteWhere(next, id);
  }

  function finish() {
    noteDragEnd();
    setDragItems(null);
    setActiveId(null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = Number(active.id);
    const current = itemsRef.current;
    const stage = over ? containerOf(id, current) : null;
    if (!over || !stage) {
      where.current = null;
      finish();
      return;
    }
    let list = current[stage];
    if (isHeader(over.id)) {
      list = [id, ...list.filter((x) => x !== id)];
    } else if (!isColumn(over.id)) {
      const oldIndex = list.indexOf(id);
      const newIndex = list.indexOf(Number(over.id));
      if (newIndex !== -1 && oldIndex !== newIndex) list = arrayMove(list, oldIndex, newIndex);
    }
    noteWhere({ ...current, [stage]: list }, id);

    const fullColumn = board[stage].map((d) => d.id);
    const index = fullIndexFromVisible(fullColumn, list, id);
    const result = moveCard(deals, id, stage, index, { probabilityOf, today });
    finish();
    if (!result.changed) return; // Dropped where it started: nothing is sent.
    onMove({ id, name: byId.get(id)!.name, stage, index, today }, result.deals);
  }

  const active = activeId !== null ? byId.get(activeId) : undefined;
  const toggleExpanded = useCallback((s: Stage) => setExpanded((e) => ({ ...e, [s]: !e[s] })), []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={detection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        where.current = null;
        finish();
      }}
      accessibility={{ announcements, screenReaderInstructions }}
      autoScroll={{ threshold: { x: 0.12, y: 0.12 } }}
    >
      <div className="board" data-dragging={activeId !== null || undefined}>
        {STAGES.map((stage) => {
          const cards = items[stage].map((id) => byId.get(id)!).filter(Boolean);
          const compact = COMPACT.includes(stage);
          const matching = compact ? board[stage].filter((d) => matchesCard(d, search)).length : 0;
          return (
            <Column
              key={stage}
              stage={stage}
              cards={cards}
              totals={columnTotals(board[stage])}
              today={today}
              compact={compact}
              hiddenCount={compact ? Math.max(0, matching - visible[stage].length) : 0}
              expanded={!!expanded[stage]}
              onToggleExpanded={toggleExpanded}
              onAddDeal={onAddDeal}
              searching={search.trim() !== ''}
            />
          );
        })}
      </div>
      {/* No drop animation: while one runs, a new drag can't start, which makes quick moves feel stuck. */}
      <DragOverlay dropAnimation={null}>
        {active ? <DealCardView deal={active} today={today} compact={activeCompact} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

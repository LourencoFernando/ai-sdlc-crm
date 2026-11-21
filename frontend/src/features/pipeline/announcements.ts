import type { Announcements } from '@dnd-kit/core';
import { STAGE_LABEL, type Stage } from '../../lib/stages';

/**
 * What a screen reader hears at each step (P14), in plain words. `describe` gives a card's name,
 * and `where` the column and 1-based position the card is over, out of that column's cards.
 */
export function createAnnouncements(
  describe: (id: number) => { name: string; stage: Stage } | undefined,
  where: () => { stage: Stage; position: number; of: number } | null,
): Announcements {
  // Only a change of place is announced, so "Picked up…" isn't talked over straight away.
  let last = '';
  const place = () => {
    const w = where();
    return w ? `${w.stage}:${w.position}:${w.of}` : 'none';
  };
  return {
    onDragStart: ({ active }) => {
      last = place();
      const d = describe(Number(active.id));
      return d ? `Picked up ${d.name} in ${STAGE_LABEL[d.stage]}` : undefined;
    },
    onDragOver: () => {
      const now = place();
      if (now === last) return undefined;
      last = now;
      const w = where();
      return w ? `Over ${STAGE_LABEL[w.stage]}, position ${w.position} of ${w.of}` : 'Not over a column';
    },
    onDragEnd: ({ active, over }) => {
      const d = describe(Number(active.id));
      const w = where();
      if (!d || !over || !w) return 'Move cancelled';
      return `Moved ${d.name} to ${STAGE_LABEL[w.stage]}, position ${w.position}`;
    },
    onDragCancel: () => 'Move cancelled',
  };
}

export const screenReaderInstructions = {
  draggable:
    'To move a deal, press Space to pick it up. Use the arrow keys to move it within a column or to another column, then press Space to drop it, or Escape to cancel. Press Enter to open the deal.',
};

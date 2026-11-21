import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Deal } from '../../api/types';
import type { Totals } from '../../lib/pipeline';
import { formatMoney, formatNumber } from '../../lib/format';
import { STAGE_COLOR, STAGE_LABEL, type Stage } from '../../lib/stages';
import { columnId, headerId } from './drop-detection';
import { SortableCard } from './SortableCard';

/** One stage: its header card with totals (P1), its cards, and Add deal or Show all. */
export const Column = memo(function Column({
  stage,
  cards,
  totals,
  today,
  compact,
  hiddenCount,
  expanded,
  onToggleExpanded,
  onAddDeal,
  searching,
}: {
  stage: Stage;
  cards: Deal[];
  totals: Totals;
  today: string;
  compact: boolean;
  hiddenCount: number;
  expanded: boolean;
  onToggleExpanded: (stage: Stage) => void;
  onAddDeal: (stage: Stage) => void;
  searching: boolean;
}) {
  const body = useDroppable({ id: columnId(stage) });
  const header = useDroppable({ id: headerId(stage) });
  const open = !compact;
  const share = totals.value > 0 ? (totals.expected / totals.value) * 100 : 0;

  return (
    <section ref={body.setNodeRef} className={`column ${compact ? 'compact' : ''}`} aria-label={STAGE_LABEL[stage]} data-stage={stage}>
      <header
        ref={header.setNodeRef}
        className={`column-head stage-${stage}`}
        style={stage === 'lost' ? undefined : { background: STAGE_COLOR[stage].pastel }}
      >
        <div className="column-title">
          <h2>{STAGE_LABEL[stage]}</h2>
          <span className="num" aria-label={`${totals.count} deals`}>
            {formatNumber(totals.count)}
          </span>
        </div>
        <p className="column-value num">{formatMoney(totals.value)}</p>
        <p className="column-note num">
          {open ? `Expected ${formatMoney(totals.expected)}` : stage === 'won' ? 'All time' : 'Not counted in totals'}
        </p>
        {open && (
          <div className="column-bar" aria-hidden="true">
            <span style={{ width: `${share}%`, background: STAGE_COLOR[stage].chart }} />
          </div>
        )}
      </header>
      <SortableContext id={stage} items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="column-cards">
          {cards.map((deal) => (
            <SortableCard key={deal.id} deal={deal} today={today} compact={compact} />
          ))}
          {cards.length === 0 && <p className="column-empty">{searching ? 'No matching deals' : 'No deals'}</p>}
        </div>
      </SortableContext>
      {compact && (hiddenCount > 0 || expanded) && (
        <button type="button" className="btn-link column-more" onClick={() => onToggleExpanded(stage)}>
          {expanded ? 'Show fewer' : `Show all ${formatNumber(cards.length + hiddenCount)}`}
        </button>
      )}
      {open && (
        <button type="button" className="add-deal" onClick={() => onAddDeal(stage)}>
          <Plus aria-hidden="true" /> Add deal
        </button>
      )}
    </section>
  );
});

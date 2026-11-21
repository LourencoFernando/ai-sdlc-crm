import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router';
import type { Deal } from '../../api/types';
import { formatMoney } from '../../lib/format';
import { STAGE_LABEL } from '../../lib/stages';
import { DealCardView } from './DealCard';
import { isClickFromDrag } from './drag-click';

/**
 * The whole card is the drag handle (P10). A drag starts after 6px, so a click still opens the
 * deal; Enter opens it from the keyboard and Space picks it up (P7). While dragged, its place
 * shows as a dashed Violet outline.
 */
export const SortableCard = memo(function SortableCard({ deal, today, compact }: { deal: Deal; today: string; compact: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <DealCardView
      ref={setNodeRef}
      deal={deal}
      today={today}
      compact={compact}
      style={style}
      className={isDragging ? 'drop-place' : ''}
      data-deal-id={deal.id}
      {...attributes}
      {...listeners}
      aria-label={`${deal.name}, ${deal.organization.name}, ${formatMoney(deal.value)}, ${STAGE_LABEL[deal.stage]}`}
      onClick={() => {
        if (!isClickFromDrag()) navigate(`/deals/${deal.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/deals/${deal.id}`);
        else listeners?.onKeyDown?.(e);
      }}
    />
  );
});

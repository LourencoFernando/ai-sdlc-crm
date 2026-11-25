import { forwardRef, memo, type CSSProperties, type HTMLAttributes } from 'react';
import { CalendarDays } from 'lucide-react';
import type { Deal } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { LatePill } from '../../components/Pills';
import { formatDate, formatMoney, formatMoneyShort, formatPercent } from '../../lib/format';
import { isLate } from '../../lib/dates';
import { STAGE_COLOR } from '../../lib/stages';

type CardProps = { deal: Deal; today: string; compact?: boolean; overlay?: boolean } & HTMLAttributes<HTMLDivElement>;

/** What a card shows (P3). Memoized, so a drag over many cards stays smooth. */
export const DealCardView = memo(
  forwardRef<HTMLDivElement, CardProps>(function DealCardView(
    { deal, today, compact, overlay, className = '', ...rest },
    ref,
  ) {
    const late = isLate(deal, today);
    if (compact) {
      return (
        <div ref={ref} className={`compact-card ${overlay ? 'lifted' : ''} ${className}`} {...rest}>
          <span className="truncate">{deal.name}</span>
          <span className="num muted small nowrap">{formatMoneyShort(deal.value)}</span>
        </div>
      );
    }
    return (
      <div ref={ref} className={`deal-card ${overlay ? 'lifted' : ''} ${className}`} {...rest}>
        <div className="deal-card-top">
          <span className="deal-card-name">{deal.name}</span>
          {late && <LatePill />}
        </div>
        <span className="deal-card-org truncate">{deal.organization.name}</span>
        <div className="deal-card-figures num">
          <span>{formatMoney(deal.value)}</span>
          <span className="muted small">{formatPercent(deal.probability)}</span>
        </div>
        <div className="prob-bar" aria-hidden="true">
          <span style={{ width: `${deal.probability}%`, background: STAGE_COLOR[deal.stage].chart } as CSSProperties} />
        </div>
        <div className="deal-card-foot">
          <span className={`deal-card-date num ${late ? 'alert-text' : ''}`}>
            <CalendarDays aria-hidden="true" />
            {formatDate(deal.closeDate, today)}
          </span>
          {deal.contact && <Avatar name={deal.contact.name} />}
        </div>
      </div>
    );
  }),
);

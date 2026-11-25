import { formatDate } from '../lib/format';
import { todayLocal } from '../lib/dates';

/** A calendar date as `Nov 20, 2026`; `late` shows it in Alert red (D4). */
export function DateText({
  date,
  late = false,
  dropYear = false,
}: {
  date: string;
  late?: boolean;
  dropYear?: boolean;
}) {
  return (
    <time dateTime={date} className={`num nowrap ${late ? 'alert-text' : ''}`}>
      {formatDate(date, dropYear ? todayLocal() : undefined)}
    </time>
  );
}

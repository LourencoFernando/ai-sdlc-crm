import { formatMoney, formatMoneyShort } from '../lib/format';

export function Money({ value, short = false }: { value: number; short?: boolean }) {
  return <span className="num nowrap">{short ? formatMoneyShort(value) : formatMoney(value)}</span>;
}

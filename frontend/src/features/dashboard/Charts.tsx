import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Dashboard } from '../../api/types';
import { formatMoney, formatMoneyShort, formatMonth, plural } from '../../lib/format';

const axis = { fontSize: 12, fill: 'var(--color-slate)', fontFamily: 'var(--font-poppins)' };

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="chart-tooltip">
      <p className="caption">{formatMonth(label)} {label.slice(0, 4)}</p>
      {payload.map((p) => (
        <p key={p.name} className="num">
          <i style={{ background: p.color }} aria-hidden="true" /> {p.name}: {money ? formatMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/** Revenue won month by month (B2) and deals won and lost (B3), over the last 12 months. */
export function LastTwelveMonths({ data }: { data: Dashboard }) {
  const months = data.months;
  const last = months[months.length - 1];
  return (
    <section className="panel" aria-labelledby="months-title">
      <div className="panel-head">
        <h2 className="panel-title" id="months-title">
          Last 12 months
        </h2>
        <p className="panel-note num">
          {formatMoney(data.yearTotals.revenueWon)} won from {plural(data.yearTotals.won, 'deal')}
        </p>
      </div>
      <h3 className="chart-title">Revenue won</h3>
      <div className="chart" role="img" aria-label={`Revenue won per month. This month ${formatMoney(last.revenueWon)}.`}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={months} margin={{ top: 24, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--color-shadow-dust)" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={axis} axisLine={false} tickLine={false} interval={0} />
            <YAxis tickFormatter={(v: number) => formatMoneyShort(v)} tick={axis} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<ChartTooltip money />} cursor={{ stroke: 'var(--color-border)' }} />
            <Area
              type="linear"
              dataKey="revenueWon"
              name="Revenue won"
              stroke="var(--color-violet)"
              strokeWidth={2.5}
              fill="var(--color-violet)"
              fillOpacity={0.07}
              dot={{ r: 3, fill: 'var(--color-snow)', stroke: 'var(--color-violet)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenueWon"
                content={({ x, y, index }) =>
                  index === months.length - 1 ? (
                    <text x={Number(x)} y={Number(y) - 12} textAnchor="end" className="chart-label">
                      {formatMoney(last.revenueWon)}
                    </text>
                  ) : null
                }
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-title-row">
        <h3 className="chart-title">Deals won and lost</h3>
        <p className="legend">
          <span>
            <i style={{ background: 'var(--color-forest)' }} aria-hidden="true" />
            Won
          </span>
          <span>
            <i style={{ background: 'var(--color-slate)' }} aria-hidden="true" />
            Lost
          </span>
        </p>
      </div>
      <div className="chart" role="img" aria-label="Deals won and lost per month">
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={months} margin={{ top: 8, right: 16, bottom: 0, left: 8 }} barGap={3} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--color-shadow-dust)" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={axis} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-periwinkle)', opacity: 0.5 }} />
            <Bar dataKey="won" name="Won" fill="var(--color-forest)" radius={[6, 6, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            <Bar dataKey="lost" name="Lost" fill="var(--color-slate)" radius={[6, 6, 0, 0]} maxBarSize={14} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

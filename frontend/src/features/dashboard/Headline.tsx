import { Link } from 'react-router';
import type { Dashboard } from '../../api/types';
import { formatMoney, formatMoneyShort, formatMonth, formatNumber, plural } from '../../lib/format';
import { STAGE_COLOR, STAGE_LABEL } from '../../lib/stages';

function Figure({ value, currency = false }: { value: number; currency?: boolean }) {
  return (
    <p className="figure">
      {currency && <span className="cur">USD</span>}
      {formatNumber(value)}
    </p>
  );
}

/** The four headline figures (B1) and the open pipeline by stage (B5), in one wide panel. */
export function Headline({ data }: { data: Dashboard }) {
  const { headline } = data;
  const diff = headline.wonThisMonth.value - headline.wonLastMonth.value;
  const lastMonth = formatMonthLong(data.months[data.months.length - 2]?.month);
  return (
    <section className="panel headline" aria-label="Headline figures">
      <div className="figures">
        <div className="stat">
          <p className="label">Won this month</p>
          <Figure value={headline.wonThisMonth.value} currency />
          <p className={`stat-note ${diff >= 0 ? 'up' : 'down'}`}>
            {diff === 0 ? `The same as ${lastMonth}` : `${formatMoney(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than ${lastMonth}`}
          </p>
        </div>
        <div className="stat">
          <p className="label">Deals won</p>
          <Figure value={headline.wonThisMonth.count} />
          <p className="stat-note muted">this month</p>
        </div>
        <div className="stat">
          <p className="label">Open pipeline</p>
          <Figure value={headline.openPipeline.value} currency />
          <p className="stat-note muted">{plural(headline.openPipeline.count, 'open deal')}</p>
        </div>
        <div className="stat">
          <p className="label">Expected revenue</p>
          <Figure value={headline.expectedRevenue} currency />
          <p className="stat-note muted">value × probability</p>
        </div>
      </div>
      <div className="by-stage">
        <div className="panel-head">
          <h2 className="panel-title">Open pipeline by stage</h2>
          <Link to="/pipeline" className="small">
            Open board
          </Link>
        </div>
        <div
          className="stage-blocks"
          style={{ gridTemplateColumns: data.pipelineByStage.map((s) => `minmax(132px, ${Math.max(s.share, 4)}fr)`).join(' ') }}
        >
          {data.pipelineByStage.map((s) => (
            <Link
              key={s.stage}
              to="/pipeline"
              className="stage-block"
              style={{ background: STAGE_COLOR[s.stage].pastel }}
              aria-label={`${STAGE_LABEL[s.stage]}: ${formatMoney(s.value)}, ${plural(s.count, 'deal')}, expected ${formatMoney(s.expectedRevenue)}`}
            >
              <span className="stage-name">
                <i style={{ background: STAGE_COLOR[s.stage].chart }} aria-hidden="true" />
                {STAGE_LABEL[s.stage]}
              </span>
              <span className="stage-value num">{formatMoneyShort(s.value)}</span>
              <span className="stage-note num">
                {plural(s.count, 'deal')} · expected {formatMoneyShort(s.expectedRevenue)}
              </span>
            </Link>
          ))}
        </div>
        <p className="panel-note">Each block's width is its share of the open value. Won and Lost are not counted.</p>
      </div>
    </section>
  );
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function formatMonthLong(month: string | undefined): string {
  if (!month) return 'last month';
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? formatMonth(month);
}


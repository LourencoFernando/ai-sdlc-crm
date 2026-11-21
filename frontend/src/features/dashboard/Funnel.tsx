import type { Dashboard } from '../../api/types';
import { formatMoneyShort, plural } from '../../lib/format';
import { STAGE_COLOR, STAGE_LABEL } from '../../lib/stages';

const STEP = 46;
const GAP = 6;
const WIDTH = 300;

/**
 * The value reaching each stage (B4): each step is as wide as the value at that stage or beyond,
 * tapering to the next, with the share kept from the step before.
 */
export function Funnel({ data }: { data: Dashboard }) {
  const steps = data.funnel;
  const max = Math.max(...steps.map((s) => s.value), 1);
  const width = (v: number) => Math.max(WIDTH * (v / max), 24);
  const height = steps.length * (STEP + GAP) - GAP;
  return (
    <section className="panel" aria-labelledby="funnel-title">
      <div className="panel-head">
        <h2 className="panel-title" id="funnel-title">
          Sales funnel
        </h2>
        <p className="panel-note">Value reaching each stage</p>
      </div>
      <div className="funnel">
        <ol className="funnel-names" aria-hidden="true">
          {steps.map((s) => (
            <li key={s.stage} style={{ height: STEP, marginBottom: GAP }}>
              {STAGE_LABEL[s.stage]}
            </li>
          ))}
        </ol>
        <svg viewBox={`0 0 ${WIDTH} ${height}`} className="funnel-shape" role="img" aria-label="Sales funnel">
          {steps.map((s, i) => {
            const top = width(s.value);
            const bottom = i < steps.length - 1 ? width(steps[i + 1].value) : top * 0.92;
            const y = i * (STEP + GAP);
            const points = [
              [(WIDTH - top) / 2, y],
              [(WIDTH + top) / 2, y],
              [(WIDTH + bottom) / 2, y + STEP],
              [(WIDTH - bottom) / 2, y + STEP],
            ]
              .map((p) => p.join(','))
              .join(' ');
            return <polygon key={s.stage} points={points} fill={STAGE_COLOR[s.stage].chart} />;
          })}
        </svg>
        <ol className="funnel-values">
          {steps.map((s) => (
            <li key={s.stage} style={{ height: STEP, marginBottom: GAP }} aria-label={STAGE_LABEL[s.stage]}>
              <span className="num funnel-value">{formatMoneyShort(s.value)}</span>
              <span className="num muted small">
                {plural(s.count, 'deal')}
                {s.keptShare !== null && ` · ${s.keptShare}%`}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="panel-note">Each step counts the deals at that stage or beyond. The percentage is the value kept from the step before. Lost is left out.</p>
    </section>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { useIsFetching, useIsMutating, useQuery } from '@tanstack/react-query';
import { api, keys } from '../../api/endpoints';
import { PageHead } from '../../components/PageHead';
import { SearchBox } from '../../components/SearchBox';
import { Skeleton } from '../../components/Skeleton';
import { useForms } from '../../app/forms';
import { stageProbability, useMeta } from '../../lib/hooks';
import { formatMoney, formatNumber } from '../../lib/format';
import { openTotals } from '../../lib/pipeline';
import { todayLocal } from '../../lib/dates';
import type { Stage } from '../../lib/stages';
import { Board } from './Board';
import { useMoveQueue } from './move-queue';

export function PipelinePage() {
  const { data: deals } = useQuery({ queryKey: keys.deals, queryFn: api.deals });
  const { data: meta } = useMeta();
  const [search, setSearch] = useState('');
  const forms = useForms();
  const enqueue = useMoveQueue();
  // Saving moves or reloading the board; tests wait for this to clear.
  const busy =
    useIsMutating({ predicate: (m) => m.options.scope?.id === 'pipeline-moves' }) +
      useIsFetching({ queryKey: keys.deals }) >
    0;
  const today = todayLocal();
  const totals = useMemo(() => (deals ? openTotals(deals, today) : null), [deals, today]);
  const probabilityOf = useCallback((stage: Stage) => stageProbability(meta, stage), [meta]);
  const addDeal = useCallback((stage: Stage) => forms.openDeal(undefined, { stage }), [forms]);

  return (
    <div className="page pipeline-page" data-busy={busy || undefined}>
      <PageHead title="Pipeline" sub="The bar in each column header shows expected revenue as a share of its value" />
      <div className="toolbar pipeline-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search deals" label="Search deals on the board" />
        {totals && (
          <dl className="board-totals" aria-label="Open deals">
            <div>
              <dt>Open pipeline</dt>
              <dd className="num">{formatMoney(totals.value)}</dd>
            </div>
            <div>
              <dt>Expected revenue</dt>
              <dd className="num">{formatMoney(totals.expected)}</dd>
            </div>
            <div>
              <dt>Open deals</dt>
              <dd className="num">{formatNumber(totals.count)}</dd>
            </div>
            {totals.late > 0 && <span className="pill pill-late">{totals.late} late</span>}
          </dl>
        )}
      </div>
      {deals && meta ? (
        <Board
          deals={deals}
          search={search}
          today={today}
          probabilityOf={probabilityOf}
          onMove={enqueue}
          onAddDeal={addDeal}
        />
      ) : (
        <div className="board" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`column ${i > 3 ? 'compact' : ''}`}>
              <Skeleton height={110} radius={16} />
              <Skeleton height={140} radius={16} />
              <Skeleton height={140} radius={16} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

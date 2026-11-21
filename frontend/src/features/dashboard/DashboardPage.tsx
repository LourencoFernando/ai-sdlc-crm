import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, keys } from '../../api/endpoints';
import { PageHead } from '../../components/PageHead';
import { Button } from '../../components/Button';
import { PanelSkeleton } from '../../components/Skeleton';
import { useForms } from '../../app/forms';
import { todayLocal } from '../../lib/dates';
import { formatLongDate, plural } from '../../lib/format';
import { Headline } from './Headline';
import { LastTwelveMonths } from './Charts';
import { FollowUps } from './FollowUps';
import { Funnel } from './Funnel';
import { RecentActivity } from './RecentActivity';
import './dashboard.css';

/** How sales are going at a glance, worked out from the data each time it loads (B1–B8). */
export function DashboardPage() {
  const today = todayLocal();
  const { data } = useQuery({ queryKey: [...keys.dashboard, today], queryFn: () => api.dashboard(today), staleTime: 0 });
  const forms = useForms();
  const sub = data
    ? `${formatLongDate(today)} · ${plural(data.headline.overdueFollowUps, 'follow-up')} overdue and ${plural(data.headline.lateDeals, 'deal')} running late`
    : formatLongDate(today);

  return (
    <div className="page stack dashboard">
      <PageHead
        title="Dashboard"
        sub={sub}
        actions={
          <Button onClick={() => forms.openActivity({})}>
            <Plus aria-hidden="true" /> Log activity
          </Button>
        }
      />
      {data ? (
        <>
          <Headline data={data} />
          <div className="dashboard-row two-one">
            <LastTwelveMonths data={data} />
            <FollowUps data={data} />
          </div>
          <div className="dashboard-row halves">
            <Funnel data={data} />
            <RecentActivity data={data} />
          </div>
        </>
      ) : (
        <>
          <PanelSkeleton rows={4} />
          <div className="dashboard-row two-one">
            <PanelSkeleton rows={8} />
            <PanelSkeleton rows={6} />
          </div>
        </>
      )}
    </div>
  );
}

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import type { Activity, Dashboard } from '../../api/types';
import { createQueryClient } from '../../app/query-client';
import { Layout } from '../../app/Layout';
import { todayLocal } from '../../lib/dates';
import { meta } from '../../test/fixtures';
import { mockFetch, Providers } from '../../test/render';
import { DashboardPage } from './DashboardPage';

const today = todayLocal();

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 1,
    kind: 'call',
    description: 'Call about renewal',
    occurredOn: today,
    followUpOn: null,
    done: false,
    fromStage: null,
    toStage: null,
    contactId: null,
    dealId: null,
    contact: null,
    deal: null,
    createdAt: `${today}T09:00:00Z`,
    ...overrides,
  };
}

function months(): Dashboard['months'] {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(y, m - 12 + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month, revenueWon: i * 10_000, won: i % 3, lost: i % 2 };
  });
}

function dashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    today,
    headline: {
      wonThisMonth: { value: 42_000, count: 3 },
      wonLastMonth: { value: 30_000, count: 2 },
      openPipeline: { value: 250_000, count: 12 },
      expectedRevenue: 120_000,
      overdueFollowUps: 2,
      lateDeals: 1,
    },
    months: months(),
    yearTotals: { revenueWon: 660_000, won: 14 },
    funnel: [
      { stage: 'new', value: 300_000, count: 20, keptShare: null },
      { stage: 'qualified', value: 200_000, count: 12, keptShare: 67 },
      { stage: 'won', value: 0, count: 0, keptShare: 0 },
    ],
    pipelineByStage: [
      { stage: 'new', value: 100_000, count: 5, expectedRevenue: 10_000, share: 40 },
      { stage: 'proposal', value: 150_000, count: 7, expectedRevenue: 75_000, share: 60 },
    ],
    followUps: {
      overdue: [
        activity({
          id: 2,
          description: 'Send the proposal',
          followUpOn: '2020-01-01',
          deal: { id: 7, name: 'Acme renewal' },
          dealId: 7,
        }),
      ],
      dueSoon: [
        activity({
          id: 3,
          description: 'Check in with Dana',
          followUpOn: today,
          contact: { id: 10, name: 'Dana Reyes' },
          contactId: 10,
        }),
      ],
    },
    recent: [
      activity({
        id: 4,
        description: 'Moved from Proposal to Negotiation',
        kind: 'stage_change',
        deal: { id: 7, name: 'Acme renewal' },
      }),
      activity({ id: 5, description: 'Intro email', kind: 'email', contact: { id: 10, name: 'Dana Reyes' } }),
      activity({ id: 6, description: 'Old note', kind: 'note', occurredOn: '2020-03-04' }),
    ],
    ...overrides,
  };
}

/** The dashboard inside the app's layout, so "Log activity" opens the real form. */
function renderDashboard() {
  const router = createMemoryRouter([{ element: <Layout />, children: [{ path: '/', element: <DashboardPage /> }] }], {
    initialEntries: ['/'],
  });
  return render(
    <Providers client={createQueryClient()}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

describe('dashboard (B1–B7)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows placeholders, then the headline figures and the overdue and late line', async () => {
    mockFetch({ 'GET /dashboard': () => ({ body: dashboard() }), 'GET /meta': () => ({ body: meta }) });
    renderDashboard();
    expect(screen.getAllByLabelText('Loading').length).toBeGreaterThan(0);

    const headline = await screen.findByRole('region', { name: 'Headline figures' });
    expect(screen.getByText(/2 follow-ups overdue and 1 deal running late/)).toBeInTheDocument();
    expect(within(headline).getByText('42,000')).toBeInTheDocument();
    expect(within(headline).getByText(/USD 12,000 more than/)).toBeInTheDocument();
    expect(within(headline).getByText('12 open deals')).toBeInTheDocument();
    expect(
      within(headline).getByRole('link', { name: /^Proposal: USD 150,000, 7 deals, expected USD 75,000/ }),
    ).toHaveAttribute('href', '/pipeline');
  });

  it('says when this month won less, or the same, as last month', async () => {
    const less = dashboard();
    less.headline.wonThisMonth.value = 10_000;
    mockFetch({ 'GET /dashboard': () => ({ body: less }), 'GET /meta': () => ({ body: meta }) });
    renderDashboard();
    expect(await screen.findByText(/USD 20,000 less than/)).toBeInTheDocument();
  });

  it('says "the same as last month" when the months match', async () => {
    const same = dashboard({ months: months().slice(-1) });
    same.headline.wonThisMonth.value = 30_000;
    mockFetch({ 'GET /dashboard': () => ({ body: same }), 'GET /meta': () => ({ body: meta }) });
    renderDashboard();
    expect(await screen.findByText('The same as last month')).toBeInTheDocument();
  });

  it('shows the last 12 months, the funnel and recent activity', async () => {
    mockFetch({ 'GET /dashboard': () => ({ body: dashboard() }), 'GET /meta': () => ({ body: meta }) });
    renderDashboard();
    const months = await screen.findByRole('region', { name: 'Last 12 months' });
    expect(within(months).getByText('USD 660,000 won from 14 deals')).toBeInTheDocument();
    expect(within(months).getByRole('img', { name: /This month USD 110,000/ })).toBeInTheDocument();

    const funnel = screen.getByRole('region', { name: 'Sales funnel' });
    const qualified = within(funnel).getByLabelText('Qualified');
    expect(qualified).toHaveTextContent('USD 200K');
    expect(qualified).toHaveTextContent('12 deals · 67%');
    expect(within(funnel).getByLabelText('New')).not.toHaveTextContent('%');

    const recent = screen.getByRole('region', { name: 'Recent activity' });
    expect(within(recent).getByRole('link', { name: 'Acme renewal' })).toHaveAttribute('href', '/deals/7');
    expect(within(recent).getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
    expect(within(recent).getAllByText('Today').length).toBe(2);
    expect(within(recent).getByText('Mar 4, 2020')).toBeInTheDocument();
  });

  it('says so when nothing has been logged and nothing is due', async () => {
    mockFetch({
      'GET /dashboard': () => ({ body: dashboard({ recent: [], followUps: { overdue: [], dueSoon: [] } }) }),
      'GET /meta': () => ({ body: meta }),
    });
    renderDashboard();
    expect(await screen.findByText('Nothing logged yet')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Due soon · 0' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Nothing due in the next 7 days')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Overdue · 0' }));
    expect(screen.getByText('Nothing overdue')).toBeInTheDocument();
  });

  it('opens on Overdue, switches to Due soon, and marks a follow-up done', async () => {
    const { calls } = mockFetch({
      'GET /dashboard': () => ({ body: dashboard() }),
      'GET /meta': () => ({ body: meta }),
      'PATCH /activities/2': () => ({ body: {} }),
    });
    renderDashboard();
    const overdue = await screen.findByRole('tabpanel', { name: 'Overdue' });
    expect(within(overdue).getByRole('link', { name: 'Acme renewal' })).toHaveAttribute('href', '/deals/7');

    await userEvent.click(within(overdue).getByRole('checkbox', { name: 'Mark done: Send the proposal' }));
    expect(calls).toContainEqual({ method: 'PATCH', path: '/activities/2', body: { done: true } });
    expect(await screen.findByText('Follow-up marked done')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Due soon · 1' }));
    const dueSoon = screen.getByRole('tabpanel', { name: 'Due soon' });
    expect(within(dueSoon).getByText('Check in with Dana')).toBeInTheDocument();
    expect(within(dueSoon).getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
  });

  it('opens the activity form from "Log activity"', async () => {
    mockFetch({
      'GET /dashboard': () => ({ body: dashboard() }),
      'GET /meta': () => ({ body: meta }),
      'GET /contacts': () => ({ body: [] }),
      'GET /deals': () => ({ body: [] }),
    });
    renderDashboard();
    await screen.findByRole('region', { name: 'Headline figures' });
    await userEvent.click(screen.getByRole('button', { name: 'Log activity' }));
    expect(await screen.findByRole('dialog', { name: 'Log activity' })).toBeInTheDocument();
  });
});

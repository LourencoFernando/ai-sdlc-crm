import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dashboard } from '../../api/types';
import { LastTwelveMonths } from './Charts';

const months: Dashboard['months'] = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, '0')}`,
  revenueWon: (i + 1) * 1_000,
  won: i % 4,
  lost: i % 3,
}));
const data = { months, yearTotals: { revenueWon: 78_000, won: 18 } } as Dashboard;

// jsdom has no layout, so give the charts a size to draw in.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: 240,
    top: 0,
    left: 0,
    right: 800,
    bottom: 240,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function hover(chart: HTMLElement, x: number) {
  const wrapper = chart.querySelector('.recharts-wrapper')!;
  fireEvent.mouseMove(wrapper, { clientX: x, clientY: 100 });
}

describe('last 12 months charts (B2, B3)', () => {
  it("labels this month's revenue on the line", () => {
    render(<LastTwelveMonths data={data} />);
    expect(screen.getByText('USD 12,000', { selector: 'text' })).toBeInTheDocument();
  });

  it('shows the month and its revenue when hovering the line', async () => {
    render(<LastTwelveMonths data={data} />);
    hover(screen.getByRole('img', { name: /Revenue won per month/ }), 700);
    expect(await screen.findByText(/Revenue won: USD 11,000/)).toBeInTheDocument();
    expect(screen.getByText('Nov 2026')).toBeInTheDocument();
  });

  it('shows the counts won and lost when hovering the bars', async () => {
    render(<LastTwelveMonths data={data} />);
    hover(screen.getByRole('img', { name: 'Deals won and lost per month' }), 700);
    expect(await screen.findByText(/Won: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Lost: 1/)).toBeInTheDocument();
  });
});

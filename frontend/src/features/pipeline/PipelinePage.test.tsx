import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Deal } from '../../api/types';
import { FormsProvider } from '../../app/forms';
import { contacts, meta, organizations } from '../../test/fixtures';
import { mockFetch, renderApp } from '../../test/render';
import { STAGES, type Stage } from '../../lib/stages';
import { PipelinePage } from './PipelinePage';

function deal(id: number, stage: Stage, position: number, extra: Partial<Deal> = {}): Deal {
  return {
    id,
    name: `Deal ${id}`,
    organizationId: 1,
    organization: { id: 1, name: 'Acme' },
    contactId: null,
    contact: null,
    stage,
    value: 1000,
    probability: 10,
    closeDate: '2099-01-01',
    position,
    createdAt: '',
    updatedAt: '',
    ...extra,
  };
}

const won = Array.from({ length: 12 }, (_, i) => deal(100 + i, 'won', i, { name: `Won ${i + 1}`, probability: 100 }));
const deals: Deal[] = [
  deal(1, 'new', 0, {
    name: 'Acme renewal',
    closeDate: '2020-01-01',
    contactId: 10,
    contact: { id: 10, name: 'Dana Reyes' },
  }),
  deal(2, 'new', 1, { name: 'Harbor expansion', value: 3000 }),
  deal(3, 'qualified', 0, { name: 'Brightwater pilot', organization: { id: 2, name: 'Brightwater Logistics' } }),
  deal(4, 'negotiation', 0, { name: 'Northwind seats', probability: 75 }),
  ...won,
  deal(200, 'lost', 0, { name: 'Lost one', probability: 0 }),
];

/**
 * jsdom has no layout, so give the board one: columns side by side, 300px apart, each with a
 * 100px header and its cards stacked below it. The drag overlay starts where the picked-up card
 * is. dnd-kit measures through getBoundingClientRect.
 */
function layOutBoard() {
  const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect');
  measure.mockImplementation(function (this: Element) {
    const box = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;
    const picked = document.querySelector('.drop-place');
    if (this.classList.contains('lifted') && picked) return picked.getBoundingClientRect();
    const column = this.closest('section[data-stage]');
    if (!column) return box(0, 0, 0, 0);
    const left = STAGES.indexOf(column.getAttribute('data-stage') as Stage) * 300;
    if (this === column) return box(left, 0, 280, 2000);
    if (this.tagName === 'HEADER') return box(left, 0, 280, 100);
    const cards = [...column.querySelectorAll('[data-deal-id]')];
    const index = cards.indexOf(this);
    if (index >= 0) return box(left, 110 + index * 130, 280, 120);
    return box(left, 0, 280, 100);
  });
}

type Answer = { status?: number; body?: unknown };

/** A server that saves a move: the deal goes to the end of its new stage. */
function saveMove(id: number) {
  return (body: unknown) => {
    const { stage } = body as { stage: Stage };
    server = server.map((d) => (d.id === id ? { ...d, stage, position: 999 } : d));
    const moved = server.find((d) => d.id === id)!;
    const columns = Object.fromEntries(
      STAGES.map((s) => [
        s,
        server
          .filter((d) => d.stage === s)
          .sort((a, b) => a.position - b.position)
          .map((d) => d.id),
      ]),
    );
    return { body: { deal: moved, columns } };
  };
}
let server: Deal[] = deals;

function setup({ move }: { move?: (id: number) => (body: unknown) => Answer } = {}) {
  server = deals;
  const save = move ?? saveMove;
  const network = mockFetch({
    'GET /deals': () => ({ body: server }),
    'GET /meta': () => ({ body: meta }),
    'GET /organizations': () => ({ body: organizations }),
    'GET /contacts': () => ({ body: contacts }),
    'POST /deals/1/move': save(1),
    'POST /deals/2/move': save(2),
  });
  const app = renderApp(
    <FormsProvider>
      <PipelinePage />
    </FormsProvider>,
    { path: '/pipeline' },
  );
  return { ...app, network };
}

const column = (name: string) => screen.getByRole('region', { name });
const card = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name},`) });
const moves = (calls: { method: string; path: string; body: unknown }[]) =>
  calls.filter((c) => c.method === 'POST' && c.path.endsWith('/move'));

describe('pipeline board', () => {
  beforeEach(layOutBoard);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a placeholder while the deals load', () => {
    setup();
    expect(screen.getByLabelText('Loading')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the open totals, leaving out Won and Lost', async () => {
    setup();
    const open = await screen.findByLabelText('Open deals');
    expect(within(open).getByText('USD 6,000')).toBeInTheDocument();
    expect(within(open).getByText('4')).toBeInTheDocument();
    expect(within(open).getByText('1 late')).toBeInTheDocument();
  });

  it('shows each column with its count, value and note', async () => {
    setup();
    const newColumn = await screen.findByRole('region', { name: 'New' });
    expect(within(newColumn).getByLabelText('2 deals')).toBeInTheDocument();
    expect(within(newColumn).getByText('USD 4,000')).toBeInTheDocument();
    expect(within(newColumn).getByText('Expected USD 400')).toBeInTheDocument();
    expect(within(column('Won')).getByText('All time')).toBeInTheDocument();
    expect(within(column('Lost')).getByText('Not counted in totals')).toBeInTheDocument();
    expect(within(column('Proposal')).getByText('No deals')).toBeInTheDocument();
  });

  it('marks a late card and shows its contact', async () => {
    setup();
    const late = await screen.findByRole('button', { name: /^Acme renewal,/ });
    expect(within(late).getByText('Late')).toBeInTheDocument();
    expect(within(late).getByText('DR')).toBeInTheDocument();
  });

  it('shows the first 10 won deals, then all of them', async () => {
    const user = userEvent.setup();
    setup();
    const wonColumn = await screen.findByRole('region', { name: 'Won' });
    expect(within(wonColumn).queryByText('Won 11')).not.toBeInTheDocument();
    await user.click(within(wonColumn).getByRole('button', { name: 'Show all 12' }));
    expect(within(wonColumn).getByText('Won 12')).toBeInTheDocument();
    await user.click(within(wonColumn).getByRole('button', { name: 'Show fewer' }));
    expect(within(wonColumn).queryByText('Won 12')).not.toBeInTheDocument();
  });

  it('filters the cards by search, keeping the totals', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByRole('region', { name: 'New' });
    await user.type(screen.getByRole('searchbox', { name: 'Search deals on the board' }), 'brightwater');
    expect(screen.queryByText('Acme renewal')).not.toBeInTheDocument();
    expect(screen.getByText('Brightwater pilot')).toBeInTheDocument();
    expect(within(column('New')).getByText('No matching deals')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Open deals')).getByText('USD 6,000')).toBeInTheDocument();
  });

  it('opens a deal from its card, by click or Enter', async () => {
    const user = userEvent.setup();
    const { router } = setup();
    await user.click(await screen.findByText('Harbor expansion'));
    expect(router.state.location.pathname).toBe('/deals/2');
    await act(() => router.navigate('/pipeline'));
    card('Acme renewal').focus();
    await user.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe('/deals/1');
  });

  it('adds a deal at a column’s stage', async () => {
    const user = userEvent.setup();
    setup();
    const negotiation = await screen.findByRole('region', { name: 'Negotiation' });
    expect(within(column('Won')).queryByRole('button', { name: 'Add deal' })).not.toBeInTheDocument();
    await user.click(within(negotiation).getByRole('button', { name: 'Add deal' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('textbox', { name: 'Probability (%)' })).toHaveValue('75');
  });
});

describe('dragging cards with the pointer', () => {
  beforeEach(layOutBoard);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const pointer = (
    type: 'pointerDown' | 'pointerMove' | 'pointerUp',
    target: Element | Document,
    x: number,
    y: number,
  ) => act(async () => void fireEvent[type](target, { clientX: x, clientY: y, isPrimary: true, button: 0 }));

  it('cancels a drop outside every column, and ignores the click it makes', async () => {
    const { network, router } = setup();
    await screen.findByRole('region', { name: 'New' });
    const target = card('Harbor expansion');
    await pointer('pointerDown', target, 140, 300);
    await pointer('pointerMove', document, 160, 320);
    await pointer('pointerMove', document, 290, 1000);
    await pointer('pointerUp', document, 290, 1000);
    fireEvent.click(target);
    expect(router.state.location.pathname).toBe('/pipeline');
    expect(moves(network.calls)).toHaveLength(0);
    expect(within(column('New')).getByText('Harbor expansion')).toBeInTheDocument();
  });

  it('drops a card on another column', async () => {
    const { network } = setup();
    await screen.findByRole('region', { name: 'New' });
    await pointer('pointerDown', card('Harbor expansion'), 140, 300);
    await pointer('pointerMove', document, 160, 320);
    await pointer('pointerMove', document, 740, 400);
    await pointer('pointerUp', document, 740, 400);
    await waitFor(() => expect(moves(network.calls)).toHaveLength(1));
    expect(moves(network.calls)[0]).toMatchObject({ path: '/deals/2/move', body: { stage: 'proposal', index: 0 } });
  });
});

describe('moving cards with the keyboard', () => {
  beforeEach(layOutBoard);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function pickUp(name: string) {
    await screen.findByRole('region', { name: 'New' });
    const target = card(name);
    target.focus();
    await act(async () => void fireEvent.keyDown(target, { code: 'Space', key: ' ' }));
    // The keyboard sensor starts listening for arrows on the next tick.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    return target;
  }
  const key = (code: string) => act(async () => void fireEvent.keyDown(document.activeElement ?? document, { code }));

  it('moves a card to the next column and saves it', async () => {
    const { network } = setup();
    await pickUp('Harbor expansion');
    await key('ArrowRight');
    await key('Space');
    await waitFor(() => expect(moves(network.calls)).toHaveLength(1));
    expect(moves(network.calls)[0]).toMatchObject({
      path: '/deals/2/move',
      body: { stage: 'qualified', index: expect.any(Number) },
    });
    expect(within(column('Qualified')).getByText('Harbor expansion')).toBeInTheDocument();
  });

  it('moves a card down its own column', async () => {
    const { network } = setup();
    await pickUp('Acme renewal');
    await key('ArrowDown');
    await key('Space');
    await waitFor(() => expect(moves(network.calls)).toHaveLength(1));
    expect(moves(network.calls)[0]).toMatchObject({ path: '/deals/1/move', body: { stage: 'new', index: 1 } });
  });

  it('sends nothing when the move is cancelled or the card is dropped where it started', async () => {
    const { network } = setup();
    await pickUp('Harbor expansion');
    await key('ArrowRight');
    await key('Escape');
    expect(within(column('New')).getByText('Harbor expansion')).toBeInTheDocument();

    await pickUp('Harbor expansion');
    await key('Space');
    expect(moves(network.calls)).toHaveLength(0);
  });

  it('moves a card to the top over its column header', async () => {
    const { network } = setup();
    await pickUp('Harbor expansion');
    await key('ArrowUp');
    await key('ArrowUp');
    await key('Space');
    await waitFor(() => expect(moves(network.calls)).toHaveLength(1));
    expect(moves(network.calls)[0]).toMatchObject({ path: '/deals/2/move', body: { stage: 'new', index: 0 } });
  });

  it('puts the card back and says so when saving fails', async () => {
    setup({ move: () => () => ({ status: 500, body: { detail: 'Broken' } }) });
    await pickUp('Harbor expansion');
    await key('ArrowRight');
    await key('Space');
    expect(
      await screen.findByText("Couldn't move Harbor expansion. The board has been refreshed."),
    ).toBeInTheDocument();
    await waitFor(() => expect(within(column('New')).getByText('Harbor expansion')).toBeInTheDocument());
  });
});

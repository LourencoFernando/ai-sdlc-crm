import { describe, expect, it } from 'vitest';
import type { Active, Over } from '@dnd-kit/core';
import type { Stage } from '../../lib/stages';
import { createAnnouncements } from './announcements';

const active = { id: 1 } as Active;
const over = { id: 2 } as Over;

function setup(
  names: Record<number, { name: string; stage: Stage }> = { 1: { name: 'Acme renewal', stage: 'proposal' } },
) {
  let where: { stage: Stage; position: number; of: number } | null = { stage: 'proposal', position: 1, of: 3 };
  const announce = createAnnouncements(
    (id) => names[id],
    () => where,
  );
  return { announce, moveTo: (w: typeof where) => (where = w) };
}

describe('drag announcements', () => {
  it('says which deal was picked up and where', () => {
    const { announce } = setup();
    expect(announce.onDragStart({ active })).toBe('Picked up Acme renewal in Proposal');
  });

  it('says nothing on pick up when the deal is unknown', () => {
    const { announce } = setup({});
    expect(announce.onDragStart({ active })).toBeUndefined();
  });

  it('announces only a change of place', () => {
    const { announce, moveTo } = setup();
    announce.onDragStart({ active });
    expect(announce.onDragOver({ active, over })).toBeUndefined();
    moveTo({ stage: 'negotiation', position: 2, of: 5 });
    expect(announce.onDragOver({ active, over })).toBe('Over Negotiation, position 2 of 5');
    expect(announce.onDragOver({ active, over })).toBeUndefined();
    moveTo(null);
    expect(announce.onDragOver({ active, over: null })).toBe('Not over a column');
  });

  it('says where the deal was moved', () => {
    const { announce, moveTo } = setup();
    moveTo({ stage: 'negotiation', position: 2, of: 5 });
    expect(announce.onDragEnd({ active, over })).toBe('Moved Acme renewal to Negotiation, position 2');
  });

  it('says the move was cancelled when it lands nowhere', () => {
    const { announce, moveTo } = setup();
    expect(announce.onDragEnd({ active, over: null })).toBe('Move cancelled');
    moveTo(null);
    expect(announce.onDragEnd({ active, over })).toBe('Move cancelled');
    expect(announce.onDragCancel({ active, over })).toBe('Move cancelled');
  });
});

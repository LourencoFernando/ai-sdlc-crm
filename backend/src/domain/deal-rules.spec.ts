import { isLate, newDealState, applyDealChange } from './deal-rules';

const today = '2026-11-20';

describe('a new deal (D2)', () => {
  it('takes its stage probability', () => {
    expect(newDealState({ stage: 'proposal', closeDate: '2026-12-01' })).toEqual({
      stage: 'proposal',
      probability: 50,
      closeDate: '2026-12-01',
    });
  });

  it('keeps a probability set by hand', () => {
    expect(newDealState({ stage: 'proposal', probability: 40, closeDate: '2026-12-01' }).probability).toBe(40);
  });

  it('defaults to New', () => {
    expect(newDealState({ closeDate: '2026-12-01' }).stage).toBe('new');
  });
});

describe('changing a deal (D2, D3, D7)', () => {
  const current = { stage: 'proposal' as const, probability: 40, closeDate: '2026-12-15' };

  it('keeps a hand-set probability while the stage stays the same', () => {
    const r = applyDealChange(current, { closeDate: '2026-12-20' }, today);
    expect(r.next).toEqual({ stage: 'proposal', probability: 40, closeDate: '2026-12-20' });
    expect(r.stageChange).toBeNull();
  });

  it('sets the new stage probability when the stage changes', () => {
    const r = applyDealChange(current, { stage: 'negotiation' }, today);
    expect(r.next.probability).toBe(75);
  });

  it('lets the probability sent with a stage change win', () => {
    const r = applyDealChange(current, { stage: 'negotiation', probability: 60 }, today);
    expect(r.next.probability).toBe(60);
  });

  it('adds one stage-change entry dated today', () => {
    const r = applyDealChange(current, { stage: 'negotiation' }, today);
    expect(r.stageChange).toEqual({
      fromStage: 'proposal',
      toStage: 'negotiation',
      occurredOn: today,
      description: 'Moved from Proposal to Negotiation',
    });
  });

  it('adds no entry when the stage sent is the same', () => {
    expect(applyDealChange(current, { stage: 'proposal', probability: 30 }, today).stageChange).toBeNull();
  });

  it('sets the close date to today on Won or Lost', () => {
    expect(applyDealChange(current, { stage: 'won' }, today).next).toEqual({
      stage: 'won',
      probability: 100,
      closeDate: today,
    });
    expect(applyDealChange(current, { stage: 'lost' }, today).next).toEqual({
      stage: 'lost',
      probability: 0,
      closeDate: today,
    });
  });

  it('sets today even when the form sends back the old close date', () => {
    expect(applyDealChange(current, { stage: 'won', closeDate: '2026-12-15' }, today).next.closeDate).toBe(today);
  });

  it('keeps a close date the user changed in the same save', () => {
    expect(applyDealChange(current, { stage: 'won', closeDate: '2026-11-18' }, today).next.closeDate).toBe(
      '2026-11-18',
    );
  });

  it('keeps an edited close date after closing', () => {
    const won = { stage: 'won' as const, probability: 100, closeDate: today };
    expect(applyDealChange(won, { closeDate: '2026-11-02' }, today).next.closeDate).toBe('2026-11-02');
  });

  it('keeps the close date when a closed deal is reopened', () => {
    const won = { stage: 'won' as const, probability: 100, closeDate: '2026-10-01' };
    const r = applyDealChange(won, { stage: 'negotiation' }, today);
    expect(r.next).toEqual({ stage: 'negotiation', probability: 75, closeDate: '2026-10-01' });
    expect(r.stageChange?.description).toBe('Moved from Won to Negotiation');
  });
});

describe('late deals (D4)', () => {
  it('is late when open and the close date has passed', () => {
    expect(isLate({ stage: 'proposal', closeDate: '2026-11-19' }, today)).toBe(true);
    expect(isLate({ stage: 'proposal', closeDate: today }, today)).toBe(false);
    expect(isLate({ stage: 'proposal', closeDate: '2026-11-21' }, today)).toBe(false);
  });

  it('is never late when Won or Lost', () => {
    expect(isLate({ stage: 'won', closeDate: '2026-01-01' }, today)).toBe(false);
    expect(isLate({ stage: 'lost', closeDate: '2026-01-01' }, today)).toBe(false);
  });
});

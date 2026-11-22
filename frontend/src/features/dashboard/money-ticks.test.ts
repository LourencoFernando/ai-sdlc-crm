import { moneyTicks } from './Charts';

describe('moneyTicks', () => {
  it('uses round steps that cover the largest value', () => {
    expect(moneyTicks(94_300)).toEqual([0, 25_000, 50_000, 75_000, 100_000]);
    expect(moneyTicks(255_000)).toEqual([0, 50_000, 100_000, 150_000, 200_000, 250_000, 300_000]);
    expect(moneyTicks(180_000)).toEqual([0, 50_000, 100_000, 150_000, 200_000]);
    expect(moneyTicks(1_000)).toEqual([0, 250, 500, 750, 1_000]);
  });

  it('shows a sensible scale when nothing was won', () => {
    expect(moneyTicks(0)).toEqual([0, 25_000, 50_000, 75_000, 100_000]);
  });
});

import { planMove, insertAtTop } from './positions';

describe('moving a card (P4)', () => {
  const col = [1, 2, 3, 4];

  it('moves within a column, up and down, to the top and the end', () => {
    expect(planMove({ from: col, to: col, sameColumn: true }, 3, 1)).toMatchObject({
      from: [1, 3, 2, 4],
      changed: true,
    });
    expect(planMove({ from: col, to: col, sameColumn: true }, 1, 2)).toMatchObject({
      from: [2, 3, 1, 4],
      changed: true,
    });
    expect(planMove({ from: col, to: col, sameColumn: true }, 4, 0)).toMatchObject({ from: [4, 1, 2, 3] });
    expect(planMove({ from: col, to: col, sameColumn: true }, 1, 3)).toMatchObject({ from: [2, 3, 4, 1] });
  });

  it('changes nothing when dropped where it started', () => {
    const r = planMove({ from: col, to: col, sameColumn: true }, 2, 1);
    expect(r.changed).toBe(false);
    expect(r.from).toEqual(col);
  });

  it('moves to the top, middle and end of another column, and to an empty one', () => {
    const other = [7, 8, 9];
    expect(planMove({ from: col, to: other, sameColumn: false }, 2, 0)).toEqual({
      from: [1, 3, 4],
      to: [2, 7, 8, 9],
      changed: true,
    });
    expect(planMove({ from: col, to: other, sameColumn: false }, 2, 1).to).toEqual([7, 2, 8, 9]);
    expect(planMove({ from: col, to: other, sameColumn: false }, 2, 3).to).toEqual([7, 8, 9, 2]);
    expect(planMove({ from: col, to: [], sameColumn: false }, 2, 0).to).toEqual([2]);
  });

  it('puts the card at the end when the index is past it', () => {
    expect(planMove({ from: col, to: [7], sameColumn: false }, 2, 99).to).toEqual([7, 2]);
    expect(planMove({ from: col, to: col, sameColumn: true }, 1, 99).from).toEqual([2, 3, 4, 1]);
  });

  it('puts a new or newly closed deal at the top', () => {
    expect(insertAtTop([5, 6], 9)).toEqual([9, 5, 6]);
    expect(insertAtTop([5, 9, 6], 9)).toEqual([9, 5, 6]);
  });
});

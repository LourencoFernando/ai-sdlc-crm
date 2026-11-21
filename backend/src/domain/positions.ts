export type Id = number;

/**
 * Where everything ends up after a card moves (P4). `index` is the card's place in the
 * full target column once it's there; past the end means the end.
 */
export function planMove(
  columns: { from: Id[]; to: Id[]; sameColumn: boolean },
  id: Id,
  index: number,
): { from: Id[]; to: Id[]; changed: boolean } {
  const from = columns.from.filter((x) => x !== id);
  if (columns.sameColumn) {
    const at = Math.max(0, Math.min(index, from.length));
    from.splice(at, 0, id);
    const changed = from.some((x, i) => x !== columns.from[i]);
    return { from, to: from, changed };
  }
  const to = columns.to.filter((x) => x !== id);
  const at = Math.max(0, Math.min(index, to.length));
  to.splice(at, 0, id);
  return { from, to, changed: true };
}

/** A new deal, or one moved to another stage from its form, goes to the top (P6, P9). */
export function insertAtTop(column: Id[], id: Id): Id[] {
  return [id, ...column.filter((x) => x !== id)];
}

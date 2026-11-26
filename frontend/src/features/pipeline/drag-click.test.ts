import { afterEach, describe, expect, it, vi } from 'vitest';
import { isClickFromDrag, noteDragEnd, noteDragStart } from './drag-click';

describe('a click after a drag', () => {
  afterEach(() => vi.useRealTimers());

  it('is ignored while dragging and just after the drop', () => {
    vi.useFakeTimers();
    noteDragStart();
    expect(isClickFromDrag()).toBe(true);
    noteDragEnd();
    expect(isClickFromDrag()).toBe(true);
    vi.advanceTimersByTime(300);
    expect(isClickFromDrag()).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { ApiError, UnreachableError } from '../api/client';
import { isLate, isValidDate } from './dates';
import { emptyToNull, handleSaveError } from './form-errors';
import { formatLongDate, formatNumber, plural, relativeDay } from './format';

describe('formatting gaps', () => {
  it('writes the long date and plurals', () => {
    expect(formatLongDate('2026-11-20')).toBe('Friday, November 20, 2026');
    expect(relativeDay('2026-11-19', '2026-11-20')).toBe('Yesterday');
    expect(plural(1, 'deal')).toBe('1 deal');
    expect(plural(2, 'person', 'people')).toBe('2 people');
    expect(formatNumber(1234.6)).toBe('1,235');
  });
});

describe('dates', () => {
  it('knows late deals and valid dates', () => {
    expect(isLate({ stage: 'proposal', closeDate: '2026-11-19' }, '2026-11-20')).toBe(true);
    expect(isLate({ stage: 'won', closeDate: '2026-11-19' }, '2026-11-20')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('20-02-2026')).toBe(false);
    expect(isValidDate('2026-02-28')).toBe(true);
  });
});

describe('save errors (G9)', () => {
  it('puts field errors under their fields, or says why the save failed', () => {
    const setError = vi.fn();
    expect(handleSaveError(new UnreachableError(), setError, [])).toMatch(/Can't reach Accountable/);
    expect(
      handleSaveError(new ApiError(409, 'Conflict', { email: 'Already used by Dana Reyes' }), setError, ['email']),
    ).toBeNull();
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Already used by Dana Reyes' });
    expect(handleSaveError(new ApiError(409, 'Conflict', { other: 'x' }), setError, ['email'])).toBe('Conflict');
    expect(handleSaveError(new Error('boom'), setError, [])).toBe("Your changes weren't saved. Try again.");
    expect(emptyToNull('  ')).toBeNull();
    expect(emptyToNull(' Acme ')).toBe('Acme');
  });
});

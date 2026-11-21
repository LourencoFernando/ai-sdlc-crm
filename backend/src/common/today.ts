import { CalendarDate, isCalendarDate, localToday } from '../domain/dates';
import { ApiError } from './api-error';

/**
 * The frontend sends its own today, so the browser and the backend agree on dates.
 * Without one, the backend uses its own clock.
 */
export function resolveToday(value: unknown): CalendarDate {
  if (value === undefined || value === null || value === '') return localToday();
  if (!isCalendarDate(value)) throw ApiError.invalid({ today: 'Send today as YYYY-MM-DD' });
  return value;
}

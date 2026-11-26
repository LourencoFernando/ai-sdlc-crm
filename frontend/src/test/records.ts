import type { Activity, Deal } from '../api/types';
import { addDays, todayLocal } from '../lib/dates';

/** Record builders for page tests, dated relative to today so "late" and "overdue" never go stale. */
export const today = todayLocal();
export const daysFromToday = (n: number) => addDays(today, n);

const stamp = { createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' };

export function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 5,
    name: 'Fleet telematics',
    organizationId: 1,
    organization: { id: 1, name: 'Acme' },
    contactId: 10,
    contact: { id: 10, name: 'Dana Reyes' },
    stage: 'proposal',
    value: 45000,
    probability: 50,
    closeDate: daysFromToday(20),
    position: 0,
    ...stamp,
    ...overrides,
  };
}

export function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    kind: 'call',
    description: 'Called about the pilot',
    occurredOn: today,
    followUpOn: null,
    done: false,
    fromStage: null,
    toStage: null,
    contactId: 10,
    dealId: 5,
    contact: { id: 10, name: 'Dana Reyes' },
    deal: { id: 5, name: 'Fleet telematics' },
    createdAt: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

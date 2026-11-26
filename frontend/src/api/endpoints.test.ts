import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './endpoints';
import { ApiError, UnreachableError, isUnreachable, request } from './client';

let fetchMock: ReturnType<typeof vi.fn>;

function answer(status: number, body?: unknown, contentType = 'application/json') {
  fetchMock.mockResolvedValueOnce(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': contentType },
    }),
  );
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit | undefined];
  return { url, method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined };
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('the endpoints', () => {
  const organization = { name: 'Acme', website: null, industry: null, notes: null };
  const contact = {
    firstName: 'Dana',
    lastName: 'Reyes',
    email: null,
    phone: null,
    jobTitle: null,
    organizationId: 1,
    status: 'lead',
  };
  const deal = {
    name: 'Fleet',
    organizationId: 1,
    contactId: null,
    stage: 'new' as const,
    value: 10,
    probability: 10,
    closeDate: '2026-12-01',
    today: '2026-11-25',
  };
  const activity = { kind: 'note', description: 'Hi', occurredOn: '2026-11-25', followUpOn: null };

  it.each([
    ['meta', () => api.meta(), 'GET', '/api/meta', undefined],
    ['organizations', () => api.organizations(), 'GET', '/api/organizations', undefined],
    ['organization', () => api.organization(3), 'GET', '/api/organizations/3', undefined],
    ['createOrganization', () => api.createOrganization(organization), 'POST', '/api/organizations', organization],
    [
      'updateOrganization',
      () => api.updateOrganization(3, { name: 'B' }),
      'PATCH',
      '/api/organizations/3',
      { name: 'B' },
    ],
    [
      'organizationDeletePreview',
      () => api.organizationDeletePreview(3),
      'GET',
      '/api/organizations/3/delete-preview',
      undefined,
    ],
    ['contacts', () => api.contacts(), 'GET', '/api/contacts', undefined],
    ['contact', () => api.contact(4), 'GET', '/api/contacts/4', undefined],
    ['createContact', () => api.createContact(contact), 'POST', '/api/contacts', contact],
    [
      'updateContact',
      () => api.updateContact(4, { status: 'customer' }),
      'PATCH',
      '/api/contacts/4',
      { status: 'customer' },
    ],
    ['contactDeletePreview', () => api.contactDeletePreview(4), 'GET', '/api/contacts/4/delete-preview', undefined],
    [
      'organizationChangePreview',
      () => api.organizationChangePreview(4, 2),
      'GET',
      '/api/contacts/4/organization-change-preview?organizationId=2',
      undefined,
    ],
    [
      'organizationChangePreview to none',
      () => api.organizationChangePreview(4, null),
      'GET',
      '/api/contacts/4/organization-change-preview?organizationId=',
      undefined,
    ],
    ['contactTimeline', () => api.contactTimeline(4), 'GET', '/api/contacts/4/timeline', undefined],
    ['deals', () => api.deals(), 'GET', '/api/deals', undefined],
    ['deal', () => api.deal(5), 'GET', '/api/deals/5', undefined],
    ['createDeal', () => api.createDeal(deal), 'POST', '/api/deals', deal],
    ['updateDeal', () => api.updateDeal(5, { value: 3 }), 'PATCH', '/api/deals/5', { value: 3 }],
    [
      'moveDeal',
      () => api.moveDeal(5, { stage: 'won', index: 0, today: '2026-11-25' }),
      'POST',
      '/api/deals/5/move',
      { stage: 'won', index: 0, today: '2026-11-25' },
    ],
    ['dealDeletePreview', () => api.dealDeletePreview(5), 'GET', '/api/deals/5/delete-preview', undefined],
    ['dealTimeline', () => api.dealTimeline(5), 'GET', '/api/deals/5/timeline', undefined],
    ['createActivity', () => api.createActivity(activity), 'POST', '/api/activities', activity],
    ['updateActivity', () => api.updateActivity(6, { done: true }), 'PATCH', '/api/activities/6', { done: true }],
    ['dashboard', () => api.dashboard('2026-11-25'), 'GET', '/api/dashboard?today=2026-11-25', undefined],
  ])('%s sends %s %s', async (_name, call, method, url, body) => {
    answer(200, { ok: true });
    await expect(call()).resolves.toEqual({ ok: true });
    expect(lastCall()).toEqual({ url, method, body });
  });

  it.each([
    ['deleteOrganization', () => api.deleteOrganization(3), '/api/organizations/3'],
    ['deleteContact', () => api.deleteContact(4), '/api/contacts/4'],
    ['deleteDeal', () => api.deleteDeal(5), '/api/deals/5'],
    ['deleteActivity', () => api.deleteActivity(6), '/api/activities/6'],
  ])('%s sends DELETE and resolves with nothing on 204', async (_name, call, url) => {
    answer(204);
    await expect(call()).resolves.toBeUndefined();
    expect(lastCall()).toEqual({ url, method: 'DELETE', body: undefined });
  });
});

describe('request', () => {
  it('sends JSON with a content type only when there is a body', async () => {
    answer(200, {});
    await request('GET', '/meta');
    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
    answer(200, {});
    await request('POST', '/organizations', { name: 'Acme' });
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('turns a refusal into an ApiError with its detail, fields and body', async () => {
    answer(409, { detail: 'Already used', fields: { email: 'Already used by Dana' }, deals: [{ id: 1, name: 'A' }] });
    const error = await request('POST', '/contacts', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      detail: 'Already used',
      fields: { email: 'Already used by Dana' },
      body: { deals: [{ id: 1, name: 'A' }] },
    });
  });

  it('gives a general message when a refusal has no detail or fields', async () => {
    answer(422, {});
    const error = await request('POST', '/contacts', {}).catch((e) => e);
    expect(error).toMatchObject({ status: 422, detail: 'Something went wrong', fields: {} });
  });

  it('says the backend is unreachable when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const error: unknown = await request('GET', '/meta').catch((e) => e);
    expect(error).toBeInstanceOf(UnreachableError);
    expect(isUnreachable(error)).toBe(true);
    expect(error).toHaveProperty('message', "Can't reach Accountable. Check that it's running.");
  });

  it.each([502, 404])('says the backend is unreachable when a proxy answers %i without JSON', async (status) => {
    answer(status, 'Bad gateway', 'text/plain');
    await expect(request('GET', '/meta')).rejects.toBeInstanceOf(UnreachableError);
  });

  it('treats any other non-JSON refusal as an ApiError', async () => {
    answer(400, 'Bad request', 'text/plain');
    await expect(request('GET', '/meta')).rejects.toMatchObject({ status: 400, detail: 'Something went wrong' });
  });

  it('resolves with nothing for a successful answer without JSON', async () => {
    answer(200, 'fine', 'text/plain');
    await expect(request('GET', '/meta')).resolves.toBeUndefined();
  });

  it('is not unreachable for other errors', () => {
    expect(isUnreachable(new ApiError(500, 'x'))).toBe(false);
  });
});

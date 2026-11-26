import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { meta, organizations } from '../test/fixtures';
import { mockFetch } from '../test/render';

describe('the app', () => {
  afterAll(() => vi.unstubAllGlobals());

  it('starts, says when a page does not exist, and opens the dashboard and the deal form', async () => {
    mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /dashboard': () => ({ status: 404, body: { detail: 'Not found' } }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /contacts': () => ({ body: [] }),
    });
    window.history.pushState({}, '', '/no-such-page');
    document.body.innerHTML = '<div id="root"></div>';
    await act(async () => {
      await import('../main');
    });

    expect(await screen.findByText("This page doesn't exist")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Go to the dashboard' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'New deal' }));
    expect(await screen.findByRole('dialog', { name: 'New deal' })).toBeInTheDocument();
  });
});

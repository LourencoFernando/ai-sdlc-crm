import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router';
import { DeleteDialog, type DeleteRequest } from './deleting';
import { mockFetch, renderApp } from '../test/render';
import { CurrentPath } from '../test/pages';
import { setUnreachable } from '../app/connection';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

function open(request: DeleteRequest, routes: Parameters<typeof mockFetch>[0], path = '/') {
  const onClose = vi.fn<() => void>();
  const fetched = mockFetch(routes);
  renderApp(
    <>
      <Routes>
        <Route path="*" element={<DeleteDialog request={request} onClose={onClose} />} />
      </Routes>
      <CurrentPath />
    </>,
    { path },
  );
  return { ...fetched, onClose };
}

const dana = { kind: 'contact', record: { id: 10, firstName: 'Dana', lastName: 'Reyes' } } as const;

describe('the delete dialog', () => {
  it('says nothing else changes for an organization with no contacts or deals', async () => {
    open(
      { kind: 'organization', record: { id: 3, name: 'Northgate' } },
      { 'GET /organizations/3/delete-preview': () => ({ body: { blocked: false, deals: [], contactsToUnlink: 0 } }) },
    );
    expect(await screen.findByText('Northgate has no contacts or deals, so nothing else changes.')).toBeInTheDocument();
  });

  it('says a contact with no activities or deals takes nothing with it', async () => {
    open(dana, {
      'GET /contacts/10/delete-preview': () => ({
        body: { activitiesToDelete: 0, activitiesToKeep: 0, dealsToUnlink: 0 },
      }),
    });
    expect(
      await screen.findByText(
        'They have no activities of their own to delete. They are not the main contact on any deal.',
      ),
    ).toBeInTheDocument();
  });

  it("offers only Close when it can't check what the delete would affect", async () => {
    open(dana, { 'GET /contacts/10/delete-preview': () => ({ status: 404, body: { detail: 'Not found' } }) });
    const dialog = await screen.findByRole('dialog', { name: 'Delete Dana Reyes?' });
    expect(
      await within(dialog).findByText("Couldn't check what this delete would affect. Close this and try again."),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it("leaves a deleted contact's own page for the contacts list", async () => {
    const { calls, onClose } = open(
      dana,
      {
        'GET /contacts/10/delete-preview': () => ({
          body: { activitiesToDelete: 1, activitiesToKeep: 0, dealsToUnlink: 1 },
        }),
        'DELETE /contacts/10': () => ({ status: 204 }),
      },
      '/contacts/10',
    );
    const dialog = await screen.findByRole('dialog', { name: 'Delete Dana Reyes?' });
    expect(
      await within(dialog).findByText('Their 1 activity will be deleted. 1 deal will be kept without a main contact.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.getByText('/contacts', { selector: 'output' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/contacts/10')).toBe(true);
  });

  it('stays on another page after deleting an organization from it', async () => {
    const { onClose } = open(
      { kind: 'organization', record: { id: 3, name: 'Northgate' } },
      {
        'GET /organizations/3/delete-preview': () => ({ body: { blocked: false, deals: [], contactsToUnlink: 2 } }),
        'DELETE /organizations/3': () => ({ status: 204 }),
      },
      '/organizations',
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.getByText('/organizations', { selector: 'output' })).toBeInTheDocument();
  });

  it("keeps the dialog open with the backend's reason when the delete is refused", async () => {
    const { onClose } = open(
      { kind: 'deal', record: { id: 5, name: 'Fleet telematics' } },
      {
        'GET /deals/5/delete-preview': () => ({ body: { activitiesToDelete: 0, activitiesToKeep: 0 } }),
        'DELETE /deals/5': () => ({ status: 409, body: { detail: 'This deal changed. Refresh and try again.' } }),
      },
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This deal changed. Refresh and try again.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('says the delete failed when the backend is unreachable', async () => {
    open({ kind: 'activity', record: { id: 1, description: 'Called' } }, { 'DELETE /activities/1': () => 'network' });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't delete. Can't reach Accountable. Check that it's running.",
    );
  });
});

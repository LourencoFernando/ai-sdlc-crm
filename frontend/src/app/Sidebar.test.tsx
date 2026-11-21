import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { readCollapsed, useSidebarCollapsed, writeCollapsed } from './sidebar-state';
import { renderApp } from '../test/render';

function Harness() {
  const [collapsed, toggle] = useSidebarCollapsed();
  return (
    <div data-sidebar={collapsed ? 'collapsed' : 'expanded'} data-testid="app">
      <Sidebar collapsed={collapsed} onToggle={toggle} onNewDeal={() => {}} />
    </div>
  );
}

describe('sidebar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves the collapsed state and reports whether it is expanded', async () => {
    renderApp(<Harness />);
    const toggle = screen.getByRole('button', { name: 'Collapse menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('app')).toHaveAttribute('data-sidebar', 'collapsed');
    expect(readCollapsed()).toBe(true);
  });

  it('starts collapsed when it was left collapsed', () => {
    writeCollapsed(true);
    renderApp(<Harness />);
    expect(screen.getByTestId('app')).toHaveAttribute('data-sidebar', 'collapsed');
  });

  it('keeps accessible names on every link when collapsed', () => {
    writeCollapsed(true);
    renderApp(<Harness />);
    for (const name of ['Dashboard', 'Organizations', 'Contacts', 'Deals', 'Pipeline', 'New deal']) {
      expect(screen.getByRole(name === 'New deal' ? 'button' : 'link', { name })).toBeInTheDocument();
    }
  });

  it('still works when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderApp(<Harness />);
    expect(screen.getByTestId('app')).toHaveAttribute('data-sidebar', 'expanded');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse menu' }));
    expect(screen.getByTestId('app')).toHaveAttribute('data-sidebar', 'collapsed');
  });

  it('marks the current section', () => {
    renderApp(<Harness />, { path: '/contacts' });
    expect(screen.getByRole('link', { name: 'Contacts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Deals' })).not.toHaveAttribute('aria-current');
  });
});

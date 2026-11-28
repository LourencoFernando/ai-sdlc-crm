import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { readCollapsed, useSidebarCollapsed, writeCollapsed } from './sidebar-state';
import { readTheme, useTheme, writeTheme } from './theme-state';
import { renderApp } from '../test/render';

function Harness() {
  const [collapsed, toggle] = useSidebarCollapsed();
  const [theme, toggleTheme] = useTheme();
  return (
    <div className="app" data-sidebar={collapsed ? 'collapsed' : 'expanded'} data-testid="app">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        onNewDeal={() => {}}
        dark={theme === 'dark'}
        onToggleDark={toggleTheme}
      />
    </div>
  );
}

describe('sidebar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
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

  describe('dark mode switch', () => {
    it('sits just above Collapse menu and is off by default', () => {
      renderApp(<Harness />);
      const dark = screen.getByRole('switch', { name: 'Dark mode' });
      expect(dark).toHaveAttribute('aria-checked', 'false');
      expect(dark.nextElementSibling).toBe(screen.getByRole('button', { name: 'Collapse menu' }));
    });

    it('turns dark mode on and off with a click, and saves the choice', async () => {
      renderApp(<Harness />);
      const dark = screen.getByRole('switch', { name: 'Dark mode' });
      await userEvent.click(dark);
      expect(dark).toHaveAttribute('aria-checked', 'true');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(readTheme()).toBe('dark');

      await userEvent.click(dark);
      expect(dark).toHaveAttribute('aria-checked', 'false');
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      expect(readTheme()).toBe('light');
    });

    it('works from the keyboard with Space and Enter', async () => {
      renderApp(<Harness />);
      const dark = screen.getByRole('switch', { name: 'Dark mode' });
      dark.focus();
      await userEvent.keyboard(' ');
      expect(dark).toHaveAttribute('aria-checked', 'true');
      await userEvent.keyboard('{Enter}');
      expect(dark).toHaveAttribute('aria-checked', 'false');
    });

    it('starts on when dark mode was saved', () => {
      writeTheme('dark');
      renderApp(<Harness />);
      expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true');
    });

    it('keeps its name and shows a tooltip when the sidebar is collapsed', async () => {
      writeCollapsed(true);
      renderApp(<Harness />);
      const dark = screen.getByRole('switch', { name: 'Dark mode' });
      await userEvent.hover(dark);
      expect(await screen.findByRole('tooltip', { name: 'Dark mode' })).toBeInTheDocument();
      await userEvent.click(dark);
      expect(dark).toHaveAttribute('aria-checked', 'true');
    });
  });
});

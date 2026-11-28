import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { useSidebarCollapsed } from './sidebar-state';
import { useTheme } from './theme-state';
import { useUnreachable } from './connection';
import { Unreachable } from './Unreachable';
import { FormsProvider, useForms } from './forms';

export function Layout() {
  return (
    <FormsProvider>
      <Shell />
    </FormsProvider>
  );
}

function Shell() {
  const [collapsed, toggle] = useSidebarCollapsed();
  const [theme, toggleTheme] = useTheme();
  const unreachable = useUnreachable();
  const forms = useForms();
  return (
    <div className="app" data-sidebar={collapsed ? 'collapsed' : 'expanded'}>
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        onNewDeal={() => forms.openDeal()}
        dark={theme === 'dark'}
        onToggleDark={toggleTheme}
      />
      {unreachable && <Unreachable />}
      <main hidden={unreachable}>
        <Outlet />
      </main>
    </div>
  );
}

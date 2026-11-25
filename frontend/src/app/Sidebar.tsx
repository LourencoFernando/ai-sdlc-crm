import { NavLink, Link } from 'react-router';
import { Tooltip } from 'radix-ui';
import { Briefcase, Building2, LayoutDashboard, PanelLeftClose, Plus, SquareKanban, Users } from 'lucide-react';
import type { ReactNode } from 'react';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/deals', label: 'Deals', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline', icon: SquareKanban },
];

/** Only shows a tooltip when the sidebar is collapsed to icons. */
function Tip({ show, label, children }: { show: boolean; label: string; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={8} className="tooltip">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  onNewDeal,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNewDeal: () => void;
}) {
  return (
    <nav className="side" aria-label="Main">
      <div className="side-top">
        <Link to="/" className="logo" aria-label="Accountable, go to the dashboard">
          <span className="logo-mark" aria-hidden="true" />
          <span className="side-text">Accountable</span>
        </Link>
      </div>
      <Tip show={collapsed} label="New deal">
        <button
          type="button"
          className="btn btn-primary side-new"
          onClick={onNewDeal}
          aria-label={collapsed ? 'New deal' : undefined}
        >
          <Plus aria-hidden="true" />
          <span className="side-text">New deal</span>
        </button>
      </Tip>
      <div className="side-links">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <Tip key={to} show={collapsed} label={label}>
            <NavLink to={to} end={end} className="side-link" aria-label={collapsed ? label : undefined}>
              <Icon aria-hidden="true" />
              <span className="side-text">{label}</span>
            </NavLink>
          </Tip>
        ))}
      </div>
      <Tip show={collapsed} label="Expand menu">
        <button
          type="button"
          className="side-toggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <PanelLeftClose aria-hidden="true" />
          <span className="side-text">Collapse menu</span>
        </button>
      </Tip>
    </nav>
  );
}

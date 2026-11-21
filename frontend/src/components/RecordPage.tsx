import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { ApiError } from '../api/client';
import { NotFound } from '../app/NotFound';
import { PanelSkeleton } from './Skeleton';

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <span className="label">{label}</span>
      <span className="fact-value">{children}</span>
    </div>
  );
}

/** The header panel of a record page: back link, title with pills, Edit and Delete, and key facts. */
export function RecordHeader({
  back,
  title,
  pills,
  onEdit,
  onDelete,
  children,
}: {
  back: { to: string; label: string };
  title: string;
  pills?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <Link to={back.to} className="back-link">
        <ChevronLeft aria-hidden="true" /> {back.label}
      </Link>
      <section className="panel record-head" aria-label="Details">
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div className="record-title-row">
            <h1 className="page-title">{title}</h1>
            {pills}
          </div>
          <div className="page-actions">
            <Button onClick={onEdit}>
              <Pencil aria-hidden="true" /> Edit
            </Button>
            <Button onClick={onDelete} className="btn-danger-outline">
              <Trash2 aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
        {children}
      </section>
    </>
  );
}

/** Loading placeholders, or "doesn't exist" for a record that was deleted. */
export function RecordState({ error, what }: { error: unknown; what: string }) {
  if (error instanceof ApiError && error.status === 404) return <NotFound what={what} />;
  return (
    <div className="page stack">
      <PanelSkeleton rows={3} />
      <div className="record-columns">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={6} />
      </div>
    </div>
  );
}

export const Empty = () => <span className="muted">—</span>;

import { useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { ApiError, isUnreachable } from '../api/client';

/**
 * Asks before deleting, naming the record and saying what happens to linked records (T5).
 * `effects` is null while the preview loads. When `blocked`, only Close is offered (X1).
 */
export function ConfirmDelete({
  open,
  onClose,
  title,
  effects,
  blocked = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  effects: ReactNode | null;
  blocked?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(
        isUnreachable(e)
          ? "Couldn't delete. Can't reach Accountable. Check that it's running."
          : e instanceof ApiError
            ? e.detail
            : "Couldn't delete. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} size="narrow">
      <div className="dialog-body">
        {effects ?? (
          <div style={{ display: 'grid', gap: 8 }}>
            <Skeleton height={14} />
            <Skeleton height={14} width="70%" />
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialog-actions">
        {blocked ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} disabled={busy || effects === null}>
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}

import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from './IconButton';

export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row-actions">
      <IconButton label={`Edit ${name}`} onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </IconButton>
      <IconButton label={`Delete ${name}`} danger onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </IconButton>
    </div>
  );
}

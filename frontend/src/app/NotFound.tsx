import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';

export function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <div className="page">
      <div className="panel">
        <EmptyState title={`This ${what} doesn't exist`}>
          <p>It may have been deleted.</p>
          <Link to="/">Go to the dashboard</Link>
        </EmptyState>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { request } from '../api/client';
import { setUnreachable } from './connection';

/** Shown instead of the page when the backend doesn't answer (G9). The page stays mounted underneath. */
export function Unreachable() {
  const client = useQueryClient();
  const [trying, setTrying] = useState(false);

  async function retry() {
    setTrying(true);
    try {
      await request('GET', '/meta');
      setUnreachable(false);
      await client.refetchQueries({ type: 'active' });
    } catch {
      // Still down: the message stays.
    } finally {
      setTrying(false);
    }
  }

  return (
    <div className="page unreachable">
      <div className="panel" role="alert">
        <span className="logo-mark" aria-hidden="true" />
        <h1 className="dialog-title">Can't reach Accountable. Check that it's running.</h1>
        <p className="muted">Start it with npm run dev, then try again. Nothing you typed has been lost.</p>
        <button type="button" className="btn btn-primary" onClick={retry} disabled={trying}>
          <RefreshCw aria-hidden="true" />
          {trying ? 'Trying…' : 'Retry'}
        </button>
      </div>
    </div>
  );
}

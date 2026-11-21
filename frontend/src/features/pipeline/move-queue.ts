import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, keys } from '../../api/endpoints';
import type { Deal } from '../../api/types';
import type { Stage } from '../../lib/stages';
import { applyMoveResult } from '../../lib/pipeline';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

export interface Move {
  id: number;
  name: string;
  stage: Stage;
  index: number;
  today: string;
}

/**
 * Saves board moves one at a time, in the order they were made (P13).
 * - The board shows each move at once, before the server answers (P5).
 * - Each move stops any board reload in progress, so a late answer can't put back an old order.
 * - The last move's answer is taken as the truth for its two columns.
 * - If a move fails, a message says so and the board reloads once the queue is empty.
 */
export function useMoveQueue() {
  const client = useQueryClient();
  const toast = useToast();
  const pending = useRef(0);
  const failed = useRef(false);

  const stopReloads = useCallback(() => client.cancelQueries({ queryKey: keys.deals }, { revert: false, silent: true }), [client]);

  const mutation = useMutation({
    scope: { id: 'pipeline-moves' },
    mutationFn: async (move: Move) => {
      await stopReloads();
      return api.moveDeal(move.id, { stage: move.stage, index: move.index, today: move.today });
    },
    onSuccess: (result) => {
      if (pending.current === 1 && !failed.current) {
        client.setQueryData<Deal[]>(keys.deals, (old) => (old ? applyMoveResult(old, result) : old));
      }
    },
    onError: (_error, move) => {
      failed.current = true;
      toast(`Couldn't move ${move.name}. The board has been refreshed.`, 'error');
    },
    onSettled: async () => {
      pending.current -= 1;
      if (pending.current > 0) return;
      failed.current = false;
      await refreshAll(client);
    },
  });

  return useCallback(
    (move: Move, optimistic: Deal[]) => {
      pending.current += 1;
      void stopReloads();
      client.setQueryData(keys.deals, optimistic);
      mutation.mutate(move);
    },
    [client, mutation, stopReloads],
  );
}

import { useQuery } from '@tanstack/react-query';
import { api, keys } from '../api/endpoints';
import type { Meta } from '../api/types';
import type { Stage } from './stages';
import { todayLocal } from './dates';

/** Stages, probabilities and industries from the backend, loaded once. */
export function useMeta() {
  return useQuery({ queryKey: keys.meta, queryFn: api.meta, staleTime: Infinity });
}

export function stageProbability(meta: Meta | undefined, stage: Stage): number {
  return meta?.stages.find((s) => s.key === stage)?.probability ?? 0;
}

/** Today on this computer. Read when needed, so a page left open past midnight still agrees. */
export function useToday(): string {
  return todayLocal();
}

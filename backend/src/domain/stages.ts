/** The pipeline stages, in board order, with each one's usual probability of close. */
export const STAGES = [
  { key: 'new', label: 'New', probability: 10 },
  { key: 'qualified', label: 'Qualified', probability: 25 },
  { key: 'proposal', label: 'Proposal', probability: 50 },
  { key: 'negotiation', label: 'Negotiation', probability: 75 },
  { key: 'won', label: 'Won', probability: 100 },
  { key: 'lost', label: 'Lost', probability: 0 },
] as const;

export type Stage = (typeof STAGES)[number]['key'];

export const STAGE_KEYS: Stage[] = STAGES.map((s) => s.key);
export const OPEN_STAGES: Stage[] = ['new', 'qualified', 'proposal', 'negotiation'];
export const CLOSED_STAGES: Stage[] = ['won', 'lost'];

export function isStage(value: unknown): value is Stage {
  return typeof value === 'string' && (STAGE_KEYS as string[]).includes(value);
}

export function isOpen(stage: Stage): boolean {
  return OPEN_STAGES.includes(stage);
}

export function isClosed(stage: Stage): boolean {
  return CLOSED_STAGES.includes(stage);
}

export function stageProbability(stage: Stage): number {
  return STAGES.find((s) => s.key === stage)!.probability;
}

export function stageLabel(stage: Stage): string {
  return STAGES.find((s) => s.key === stage)!.label;
}

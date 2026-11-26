/** Stage keys in board order. Labels are UI text; probabilities come from /api/meta. */
export const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type Stage = (typeof STAGES)[number];
export const OPEN_STAGES: Stage[] = ['new', 'qualified', 'proposal', 'negotiation'];

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

/** Pill backgrounds and chart colors from the brand's stage table. */
export const STAGE_COLOR: Record<Stage, { pastel: string; chart: string }> = {
  new: { pastel: 'var(--color-sky)', chart: 'var(--color-ocean)' },
  qualified: { pastel: 'var(--color-periwinkle-wash)', chart: 'var(--color-violet)' },
  proposal: { pastel: 'var(--color-lavender)', chart: 'var(--color-ultra-violet)' },
  negotiation: { pastel: 'var(--color-apricot-wash)', chart: 'var(--color-ember)' },
  won: { pastel: 'var(--color-mint)', chart: 'var(--color-forest)' },
  lost: { pastel: 'var(--color-snow)', chart: 'var(--color-slate)' },
};

export function isOpenStage(stage: string): boolean {
  return (OPEN_STAGES as string[]).includes(stage);
}

export const CONTACT_STATUSES = ['lead', 'qualified', 'customer'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const STATUS_LABEL: Record<ContactStatus, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  customer: 'Customer',
};

export const ACTIVITY_KINDS = ['note', 'call', 'email'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export const KIND_LABEL: Record<ActivityKind | 'stage_change', string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  stage_change: 'Stage change',
};

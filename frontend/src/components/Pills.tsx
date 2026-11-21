import { STAGE_LABEL, STATUS_LABEL, type ContactStatus, type Stage } from '../lib/stages';

export function StagePill({ stage }: { stage: Stage }) {
  return <span className={`pill pill-${stage}`}>{STAGE_LABEL[stage]}</span>;
}

export function StatusPill({ status }: { status: ContactStatus }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function LatePill() {
  return <span className="pill pill-late">Late</span>;
}

import { CalendarDate } from './dates';
import { isClosed, isOpen, Stage, stageLabel, stageProbability } from './stages';

export interface DealState {
  stage: Stage;
  probability: number;
  closeDate: CalendarDate;
}

export interface DealChange {
  stage?: Stage;
  probability?: number;
  closeDate?: CalendarDate;
}

export interface StageChangeEntry {
  fromStage: Stage;
  toStage: Stage;
  occurredOn: CalendarDate;
  description: string;
}

/** A new deal takes its stage's probability unless one was set by hand (D2). */
export function newDealState(input: { stage?: Stage; probability?: number; closeDate: CalendarDate }): DealState {
  const stage = input.stage ?? 'new';
  return { stage, probability: input.probability ?? stageProbability(stage), closeDate: input.closeDate };
}

export function stageChangeDescription(from: Stage, to: Stage): string {
  return `Moved from ${stageLabel(from)} to ${stageLabel(to)}`;
}

/**
 * What a save or a move does to a deal (D2, D3, D7):
 * - a stage change sets the new stage's probability, unless a probability was sent with it;
 * - moving into Won or Lost sets the close date to today, unless the save also changed the date;
 * - a stage change gives one timeline entry dated today.
 */
export function applyDealChange(
  current: DealState,
  change: DealChange,
  today: CalendarDate,
): { next: DealState; stageChange: StageChangeEntry | null } {
  const stage = change.stage ?? current.stage;
  const stageChanged = stage !== current.stage;

  let probability = change.probability ?? current.probability;
  if (stageChanged && change.probability === undefined) probability = stageProbability(stage);

  let closeDate = change.closeDate ?? current.closeDate;
  const dateEdited = change.closeDate !== undefined && change.closeDate !== current.closeDate;
  if (stageChanged && isClosed(stage) && !dateEdited) closeDate = today;

  const stageChange = stageChanged
    ? {
        fromStage: current.stage,
        toStage: stage,
        occurredOn: today,
        description: stageChangeDescription(current.stage, stage),
      }
    : null;

  return { next: { stage, probability, closeDate }, stageChange };
}

/** Open and past its close date (D4). */
export function isLate(deal: { stage: Stage; closeDate: CalendarDate }, today: CalendarDate): boolean {
  return isOpen(deal.stage) && deal.closeDate < today;
}

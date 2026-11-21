import type { ActivityKind, ContactStatus, Stage } from '../lib/stages';

export interface Ref {
  id: number;
  name: string;
}

export interface Meta {
  stages: { key: Stage; label: string; probability: number }[];
  industries: string[];
}

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRow extends Organization {
  contactCount: number;
  openDealCount: number;
  openPipeline: number;
}

export interface ContactSummary {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  status: ContactStatus;
  organizationId: number | null;
}

export interface OrganizationDetail extends Organization {
  contacts: ContactSummary[];
  deals: Deal[];
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  status: ContactStatus;
  organizationId: number | null;
  organization: Ref | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDetail extends Contact {
  deals: Deal[];
}

export interface Deal {
  id: number;
  name: string;
  organizationId: number;
  organization: Ref;
  contactId: number | null;
  contact: Ref | null;
  stage: Stage;
  value: number;
  probability: number;
  closeDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  kind: ActivityKind | 'stage_change';
  description: string;
  occurredOn: string;
  followUpOn: string | null;
  done: boolean;
  fromStage: Stage | null;
  toStage: Stage | null;
  contactId: number | null;
  dealId: number | null;
  contact: Ref | null;
  deal: Ref | null;
  createdAt: string;
}

export interface MoveResult {
  deal: Deal;
  columns: Partial<Record<Stage, number[]>>;
}

export interface Dashboard {
  today: string;
  headline: {
    wonThisMonth: { value: number; count: number };
    wonLastMonth: { value: number; count: number };
    openPipeline: { value: number; count: number };
    expectedRevenue: number;
    overdueFollowUps: number;
    lateDeals: number;
  };
  months: { month: string; revenueWon: number; won: number; lost: number }[];
  yearTotals: { revenueWon: number; won: number };
  funnel: { stage: Stage; value: number; count: number; keptShare: number | null }[];
  pipelineByStage: { stage: Stage; value: number; count: number; expectedRevenue: number; share: number }[];
  followUps: { overdue: Activity[]; dueSoon: Activity[] };
  recent: Activity[];
}

export interface OrganizationDeletePreview {
  blocked: boolean;
  deals: Ref[];
  contactsToUnlink: number;
}
export interface ContactDeletePreview {
  activitiesToDelete: number;
  activitiesToKeep: number;
  dealsToUnlink: number;
}
export interface DealDeletePreview {
  activitiesToDelete: number;
  activitiesToKeep: number;
}

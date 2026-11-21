import { request } from './client';
import type {
  Activity,
  Contact,
  ContactDeletePreview,
  ContactDetail,
  Dashboard,
  Deal,
  DealDeletePreview,
  Meta,
  MoveResult,
  Organization,
  OrganizationDeletePreview,
  OrganizationDetail,
  OrganizationRow,
  Ref,
} from './types';
import type { Stage } from '../lib/stages';

export interface OrganizationInput {
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
}
export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  organizationId: number | null;
  status: string;
  confirmUnlink?: boolean;
}
export interface DealInput {
  name: string;
  organizationId: number;
  contactId: number | null;
  stage: Stage;
  value: number;
  probability: number;
  closeDate: string;
  today: string;
}
export interface ActivityInput {
  kind: string;
  description: string;
  occurredOn: string;
  followUpOn: string | null;
  done?: boolean;
  contactId?: number | null;
  dealId?: number | null;
  relateToMainContact?: boolean;
}

export const api = {
  meta: () => request<Meta>('GET', '/meta'),

  organizations: () => request<OrganizationRow[]>('GET', '/organizations'),
  organization: (id: number) => request<OrganizationDetail>('GET', `/organizations/${id}`),
  createOrganization: (body: OrganizationInput) => request<Organization>('POST', '/organizations', body),
  updateOrganization: (id: number, body: Partial<OrganizationInput>) => request<Organization>('PATCH', `/organizations/${id}`, body),
  organizationDeletePreview: (id: number) => request<OrganizationDeletePreview>('GET', `/organizations/${id}/delete-preview`),
  deleteOrganization: (id: number) => request<void>('DELETE', `/organizations/${id}`),

  contacts: () => request<Contact[]>('GET', '/contacts'),
  contact: (id: number) => request<ContactDetail>('GET', `/contacts/${id}`),
  createContact: (body: ContactInput) => request<Contact>('POST', '/contacts', body),
  updateContact: (id: number, body: Partial<ContactInput>) => request<Contact>('PATCH', `/contacts/${id}`, body),
  contactDeletePreview: (id: number) => request<ContactDeletePreview>('GET', `/contacts/${id}/delete-preview`),
  organizationChangePreview: (id: number, organizationId: number | null) =>
    request<{ deals: Ref[] }>('GET', `/contacts/${id}/organization-change-preview?organizationId=${organizationId ?? ''}`),
  deleteContact: (id: number) => request<void>('DELETE', `/contacts/${id}`),
  contactTimeline: (id: number) => request<Activity[]>('GET', `/contacts/${id}/timeline`),

  deals: () => request<Deal[]>('GET', '/deals'),
  deal: (id: number) => request<Deal>('GET', `/deals/${id}`),
  createDeal: (body: DealInput) => request<Deal>('POST', '/deals', body),
  updateDeal: (id: number, body: Partial<DealInput>) => request<Deal>('PATCH', `/deals/${id}`, body),
  moveDeal: (id: number, body: { stage: Stage; index: number; today: string }) =>
    request<MoveResult>('POST', `/deals/${id}/move`, body),
  dealDeletePreview: (id: number) => request<DealDeletePreview>('GET', `/deals/${id}/delete-preview`),
  deleteDeal: (id: number) => request<void>('DELETE', `/deals/${id}`),
  dealTimeline: (id: number) => request<Activity[]>('GET', `/deals/${id}/timeline`),

  createActivity: (body: ActivityInput) => request<Activity>('POST', '/activities', body),
  updateActivity: (id: number, body: Partial<ActivityInput>) => request<Activity>('PATCH', `/activities/${id}`, body),
  deleteActivity: (id: number) => request<void>('DELETE', `/activities/${id}`),

  dashboard: (today: string) => request<Dashboard>('GET', `/dashboard?today=${today}`),
};

/** Query keys, so every screen shares one cache. */
export const keys = {
  meta: ['meta'] as const,
  organizations: ['organizations'] as const,
  organization: (id: number) => ['organization', id] as const,
  contacts: ['contacts'] as const,
  contact: (id: number) => ['contact', id] as const,
  deals: ['deals'] as const,
  deal: (id: number) => ['deal', id] as const,
  contactTimeline: (id: number) => ['timeline', 'contact', id] as const,
  dealTimeline: (id: number) => ['timeline', 'deal', id] as const,
  dashboard: ['dashboard'] as const,
};

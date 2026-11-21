import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './fixtures';

/** Reads the test backend directly, to find records to work with. */
export async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(`${API_URL}/api${path}`);
  if (!res.ok()) throw new Error(`GET ${path} gave ${res.status()}`);
  return (await res.json()) as T;
}

export interface DealRow {
  id: number;
  name: string;
  stage: string;
  value: number;
  probability: number;
  closeDate: string;
  position: number;
  organizationId: number;
  organization: { id: number; name: string };
  contactId: number | null;
  contact: { id: number; name: string } | null;
}
export interface ContactRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string | null;
  status: string;
  organizationId: number | null;
  organization: { id: number; name: string } | null;
}
export interface OrganizationRow {
  id: number;
  name: string;
  openDealCount: number;
  contactCount: number;
}

export const deals = (r: APIRequestContext) => apiGet<DealRow[]>(r, '/deals');
export const contacts = (r: APIRequestContext) => apiGet<ContactRow[]>(r, '/contacts');
export const organizations = (r: APIRequestContext) => apiGet<OrganizationRow[]>(r, '/organizations');

import type { Contact, Meta, OrganizationRow } from '../api/types';

export const meta: Meta = {
  stages: [
    { key: 'new', label: 'New', probability: 10 },
    { key: 'qualified', label: 'Qualified', probability: 25 },
    { key: 'proposal', label: 'Proposal', probability: 50 },
    { key: 'negotiation', label: 'Negotiation', probability: 75 },
    { key: 'won', label: 'Won', probability: 100 },
    { key: 'lost', label: 'Lost', probability: 0 },
  ],
  industries: ['Software', 'Retail', 'Other'],
};

const stamp = { createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' };

export const organizations: OrganizationRow[] = [
  { id: 1, name: 'Acme', website: null, industry: 'Software', notes: null, contactCount: 1, openDealCount: 0, openPipeline: 0, ...stamp },
  { id: 2, name: 'Brightwater Logistics', website: null, industry: 'Retail', notes: null, contactCount: 1, openDealCount: 0, openPipeline: 0, ...stamp },
];

export const contacts: Contact[] = [
  { id: 10, firstName: 'Dana', lastName: 'Reyes', email: 'dana@acme.example', phone: null, jobTitle: null, status: 'lead', organizationId: 1, organization: { id: 1, name: 'Acme' }, ...stamp },
  { id: 11, firstName: 'Uma', lastName: 'Iyer', email: null, phone: null, jobTitle: null, status: 'customer', organizationId: 2, organization: { id: 2, name: 'Brightwater Logistics' }, ...stamp },
];

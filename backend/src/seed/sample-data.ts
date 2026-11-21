import { addDays, CalendarDate, daysBetween, lastMonths } from '../domain/dates';
import { Industry } from '../domain/industries';
import { OPEN_STAGES, Stage, STAGE_KEYS, stageProbability } from '../domain/stages';
import { stageChangeDescription } from '../domain/deal-rules';

/**
 * Realistic sample data (S1–S4), built from a given today so it never goes stale and
 * can be tested with a fixed date. A seeded random generator keeps it the same every run.
 */

export interface SampleOrganization { id: number; name: string; website: string; industry: Industry; notes: string | null }
export interface SampleContact {
  id: number; firstName: string; lastName: string; email: string | null; phone: string | null;
  jobTitle: string | null; organizationId: number | null; status: 'lead' | 'qualified' | 'customer';
}
export interface SampleDeal {
  id: number; name: string; organizationId: number; contactId: number | null; stage: Stage;
  value: number; probability: number; closeDate: CalendarDate; position: number;
}
export interface SampleActivity {
  id: number; seq: number; kind: 'note' | 'call' | 'email' | 'stage_change'; contactId: number | null; dealId: number | null;
  description: string; occurredOn: CalendarDate; followUpOn: CalendarDate | null; done: boolean;
  fromStage: Stage | null; toStage: Stage | null;
}
export interface SampleData {
  organizations: SampleOrganization[];
  contacts: SampleContact[];
  deals: SampleDeal[];
  activities: SampleActivity[];
}

/** mulberry32: small, fast and deterministic. */
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    shuffle: <T>(xs: T[]): T[] => {
      for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
      }
      return xs;
    },
  };
}

const ORGANIZATIONS: { name: string; domain: string; industry: Industry; area: string; deals: string[]; notes?: string }[] = [
  { name: 'Orbitra Software', domain: 'orbitra', industry: 'Software', area: '206', deals: ['Analytics seats', 'Enterprise support plan', 'SSO rollout'], notes: 'Fast-growing SaaS team. Buys in quarterly cycles.' },
  { name: 'Corvo Manufacturing', domain: 'corvo', industry: 'Manufacturing', area: '414', deals: ['Plant maintenance suite', 'ERP connector', 'Warehouse sensors'] },
  { name: 'Quarry Lane Builders', domain: 'quarrylane', industry: 'Construction', area: '303', deals: ['Site safety app', 'Project costing module'], notes: 'Regional builder with 14 active sites.' },
  { name: 'Pinecrest Hotels', domain: 'pinecrest', industry: 'Hospitality', area: '702', deals: ['Booking engine', 'Guest Wi-Fi upgrade', 'Multi-site rollout'] },
  { name: 'Brightwater Logistics', domain: 'brightwater', industry: 'Logistics', area: '312', deals: ['Fleet telematics', 'Route optimization', 'Fleet tracking pilot'] },
  { name: 'Fernleaf Retail', domain: 'fernleaf', industry: 'Retail', area: '415', deals: ['Store POS refresh', 'Loyalty program', 'Inventory forecasting'] },
  { name: 'Kestrel Health', domain: 'kestrel', industry: 'Healthcare', area: '619', deals: ['Patient portal', 'Telehealth add-on', 'Clinic scheduling rollout'] },
  { name: 'Fernhill Academy', domain: 'fernhill', industry: 'Education', area: '503', deals: ['Campus licences', 'Course platform licences'] },
  { name: 'Halcyon Media', domain: 'halcyon', industry: 'Media', area: '323', deals: ['Content archive migration', 'Ad operations dashboard', 'Ad inventory tools'] },
  { name: 'Tidewell Energy', domain: 'tidewell', industry: 'Energy', area: '713', deals: ['Smart meter dashboards', 'Grid analytics trial', 'Solar forecasting'] },
  { name: 'Saltmarsh Capital', domain: 'saltmarsh', industry: 'Financial services', area: '212', deals: ['Data warehouse build', 'Payroll integration', 'Treasury reporting'] },
  { name: 'Northgate Legal', domain: 'northgatelegal', industry: 'Professional services', area: '617', deals: ['Matter management', 'Document review tools'] },
  { name: 'Bluefin Insurance', domain: 'bluefin', industry: 'Financial services', area: '305', deals: ['Claims portal', 'Broker analytics'] },
  { name: 'Ridgeway Freight', domain: 'ridgeway', industry: 'Logistics', area: '901', deals: ['Depot cameras', 'Fleet fuel reporting', 'Driver app'] },
  { name: 'Marlow Outfitters', domain: 'marlow', industry: 'Retail', area: '207', deals: ['E-commerce replatform', 'Shift planning'] },
  { name: 'Lumen Analytics', domain: 'lumen', industry: 'Software', area: '512', deals: ['Learning analytics', 'API usage tier'] },
  { name: 'Harborview Hotels', domain: 'harborview', industry: 'Hospitality', area: '843', deals: ['Revenue management pilot', 'Housekeeping app'] },
  { name: 'Oakfield College', domain: 'oakfield', industry: 'Education', area: '608', deals: ['Student records upgrade', 'Library system'] },
  { name: 'Brightline Studios', domain: 'brightline', industry: 'Media', area: '310', deals: ['Render farm capacity', 'Rights tracking'] },
  { name: 'Ironbark Steel', domain: 'ironbark', industry: 'Manufacturing', area: '412', deals: ['Asset tracking', 'Quality inspection app'] },
  { name: 'Greenfield Solar', domain: 'greenfield', industry: 'Energy', area: '505', deals: ['Installer scheduling', 'Panel monitoring'] },
  { name: 'Cedar Point Clinics', domain: 'cedarpoint', industry: 'Healthcare', area: '919', deals: ['Referral tracking', 'Billing integration'] },
  { name: 'Alder & Finch Consulting', domain: 'alderfinch', industry: 'Professional services', area: '612', deals: ['Timesheet integration', 'Client portal'] },
  { name: 'Summit Ridge Construction', domain: 'summitridge', industry: 'Construction', area: '801', deals: ['Equipment hire tracking', 'Bid management'] },
  { name: 'Copperleaf Foods', domain: 'copperleaf', industry: 'Other', area: '971', deals: ['Cold chain monitoring', 'Supplier portal'] },
];

const FIRST_NAMES = [
  'Ben', 'Victor', 'Kofi', 'Amara', 'Laura', 'Yusuf', 'Omar', 'Farah', 'Uma', 'Elena', 'Nadia', 'Gavin', 'Rosa', 'Carla',
  'Isaac', 'Priya', 'Tomi', 'Julia', 'Daniel', 'Hana', 'Quinn', 'Ximena', 'Marcus', 'Samuel', 'Wen', 'Aisha', 'Lucas',
  'Mei', 'Oscar', 'Ingrid', 'Rahul', 'Sofia', 'Theo', 'Grace', 'Mateo', 'Leah', 'Noah', 'Zara', 'Felix', 'Chloe',
];
const LAST_NAMES = [
  'Achterberg', 'Almeida', 'Asante', 'Bello', 'Chen', 'Demir', 'Farouk', 'Haddad', 'Iyer', 'Kovacs', 'Lindqvist', 'Lowe',
  'Martinez', 'Mendes', 'Mensah', 'Nair', 'Okafor', 'Park', 'Reyes', 'Sato', 'Taylor', 'Torres', 'Webb', 'Wright', 'Zhou',
  'Brennan', 'Costa', 'Dubois', 'Eriksen', 'Fischer', 'Garcia', 'Hughes', 'Ito', 'Jensen', 'Kim', 'Larsen', 'Moreau',
  'Novak', 'Oliveira', 'Patel',
];
const JOB_TITLES = [
  'CTO', 'IT Director', 'Project Manager', 'Head of Stores', 'Operations Manager', 'Engineering Manager', 'IT Manager',
  'Procurement Lead', 'Head of Digital Learning', 'Managing Editor', 'Finance Director', 'Fleet Director',
  'Practice Manager', 'Plant Manager', 'Head of Analytics', 'Chief Operating Officer', 'Revenue Manager',
  'Customer Success Lead', 'Safety Officer', 'Registrar', 'Head of Partnerships', 'Product Owner',
];
const FREELANCERS = [
  { firstName: 'Omar', lastName: 'Farouk', jobTitle: 'Freelance developer' },
  { firstName: 'Farah', lastName: 'Haddad', jobTitle: 'Independent consultant' },
  { firstName: 'Lucas', lastName: 'Brennan', jobTitle: 'Interim CFO' },
  { firstName: 'Mei', lastName: 'Ito', jobTitle: 'Procurement adviser' },
];

const CALLS = [
  'Call with {first} about the rollout timeline', 'Discovery call with {first}', 'Walked {first} through pricing tiers',
  'Call to confirm budget with {first}', '{first} asked for a reference customer', 'Quarterly check-in with {first}',
  'Agreed phase one scope with {first}', 'Call about contract terms', 'Talked through the security review',
];
const EMAILS = [
  'Sent revised proposal to {first}', 'Emailed the implementation plan', 'Sent pricing tiers to {first}',
  'Shared the case study with {first}', 'Sent the order form for signature', 'Followed up on the demo',
  'Sent meeting notes and next steps', 'Answered questions about data residency',
];
const NOTES = [
  'Procurement wants a three-year term', '{first} prefers a phased start in the new quarter',
  'Budget approved for the first phase', 'Competing quote from a larger vendor', 'Needs sign-off from the finance team',
  'Strong interest in the reporting module', 'Legal is reviewing the data processing terms',
  'Decision moved to the next board meeting', 'Team is happy with the pilot so far',
];
const FOLLOW_UPS = [
  'Call {first} about the budget', 'Send revised proposal to {first}', 'Chase the signed order form',
  'Email pricing tiers to {first}', 'Answer the security questionnaire', 'Book a demo for the wider team',
  'Check in on the pilot with {first}', 'Send the renewal quote', 'Confirm the start date with {first}',
  'Share onboarding plan with {first}', 'Follow up on the reference call', 'Prepare the contract redlines',
];

export function buildSampleData(today: CalendarDate): SampleData {
  const r = random(20261120);

  const organizations: SampleOrganization[] = ORGANIZATIONS.map((o, i) => ({
    id: i + 1,
    name: o.name,
    website: `https://${o.domain}.example`,
    industry: o.industry,
    notes: o.notes ?? null,
  }));

  // Contacts: 76 at organizations (3 each, plus one more at the first), 4 freelancers.
  const contacts: SampleContact[] = [];
  const usedNames = new Set<string>();
  const statuses: SampleContact['status'][] = r.shuffle([
    ...Array<SampleContact['status']>(40).fill('lead'),
    ...Array<SampleContact['status']>(20).fill('qualified'),
    ...Array<SampleContact['status']>(20).fill('customer'),
  ]);
  let phoneSuffix = 100;
  const phone = (area: string) => `+1 ${area} 555 0${String(phoneSuffix++).padStart(3, '0')}`;
  for (let i = 0; i < 76; i++) {
    const org = ORGANIZATIONS[i % ORGANIZATIONS.length];
    let first: string, last: string;
    do {
      first = r.pick(FIRST_NAMES);
      last = r.pick(LAST_NAMES);
    } while (usedNames.has(`${first} ${last}`));
    usedNames.add(`${first} ${last}`);
    contacts.push({
      id: contacts.length + 1,
      firstName: first,
      lastName: last,
      email: r.next() < 0.06 ? null : `${first}.${last}@${org.domain}.example`.toLowerCase(),
      phone: r.next() < 0.08 ? null : phone(org.area),
      jobTitle: r.pick(JOB_TITLES),
      organizationId: (i % ORGANIZATIONS.length) + 1,
      status: statuses[contacts.length],
    });
  }
  for (const f of FREELANCERS) {
    contacts.push({
      id: contacts.length + 1,
      ...f,
      email: `${f.firstName}.${f.lastName}@mailbox.example`.toLowerCase(),
      phone: phone('617'),
      organizationId: null,
      status: statuses[contacts.length],
    });
  }
  const contactsOf = (orgId: number) => contacts.filter((c) => c.organizationId === orgId);

  // Deals: 26 open, 22 won and 12 lost, so every one of the last 12 months has won and lost deals.
  const dealSlots: { name: string; organizationId: number }[] = ORGANIZATIONS.flatMap((o, i) =>
    o.deals.map((name) => ({ name, organizationId: i + 1 })),
  );
  r.shuffle(dealSlots);
  const months = lastMonths(today, 12); // oldest first
  const dayIn = (month: string, maxDay = 28) => `${month}-${String(r.int(1, maxDay)).padStart(2, '0')}`;
  const todayDay = Number(today.slice(8, 10));
  const closeDayThisMonth = () => dayIn(months[11], todayDay);

  const plan: { stage: Stage; closeDate: CalendarDate }[] = [];
  const openCounts: Record<string, number> = { new: 9, qualified: 7, proposal: 6, negotiation: 4 };
  const lateStages: Stage[] = ['qualified', 'proposal', 'negotiation', 'negotiation'];
  for (const stage of OPEN_STAGES) {
    for (let i = 0; i < openCounts[stage]; i++) plan.push({ stage, closeDate: addDays(today, r.int(3, 120)) });
  }
  // Four open deals running late (S2).
  for (const stage of lateStages) {
    const slot = plan.find((p) => p.stage === stage && p.closeDate >= today)!;
    slot.closeDate = addDays(today, -r.int(2, 24));
  }
  for (const month of months) {
    plan.push({ stage: 'won', closeDate: month === months[11] ? closeDayThisMonth() : dayIn(month) });
    plan.push({ stage: 'lost', closeDate: month === months[11] ? closeDayThisMonth() : dayIn(month) });
  }
  for (let i = 0; i < 10; i++) {
    const month = months[r.int(0, 11)];
    plan.push({ stage: 'won', closeDate: month === months[11] ? closeDayThisMonth() : dayIn(month) });
  }

  const deals: SampleDeal[] = dealSlots.map((slot, i) => {
    const p = plan[i];
    const people = contactsOf(slot.organizationId);
    return {
      id: i + 1,
      name: slot.name,
      organizationId: slot.organizationId,
      contactId: r.next() < 0.92 && people.length ? r.pick(people).id : null,
      stage: p.stage,
      value: r.int(16, 180) * 500,
      probability: r.next() < 0.12 && OPEN_STAGES.includes(p.stage) ? stageProbability(p.stage) + 5 : stageProbability(p.stage),
      closeDate: p.closeDate,
      position: 0,
    };
  });
  // Board order: open columns by close date, Won and Lost newest first.
  for (const stage of STAGE_KEYS) {
    const column = deals.filter((d) => d.stage === stage);
    column.sort((a, b) =>
      stage === 'won' || stage === 'lost' ? b.closeDate.localeCompare(a.closeDate) || a.id - b.id : a.closeDate.localeCompare(b.closeDate) || a.id - b.id,
    );
    column.forEach((d, i) => (d.position = i));
  }

  const activities: SampleActivity[] = [];
  const firstDay = addDays(today, -360);
  const add = (a: Omit<SampleActivity, 'id' | 'seq'>) => activities.push({ ...a, id: activities.length + 1, seq: activities.length });
  const nameOf = (contactId: number | null) => contacts.find((c) => c.id === contactId)?.firstName ?? 'the team';
  const fill = (template: string, contactId: number | null) => template.replace('{first}', nameOf(contactId));

  // Stage changes: each deal past New walks the stages up to where it is now (S3).
  for (const d of deals) {
    if (d.stage === 'new') continue;
    const path: Stage[] = ['new'];
    if (d.stage === 'lost') {
      const reached = r.int(0, 3);
      for (let i = 1; i <= reached; i++) path.push(OPEN_STAGES[i]);
      path.push('lost');
    } else {
      for (let i = 1; i < STAGE_KEYS.indexOf(d.stage) + 1; i++) path.push(STAGE_KEYS[i]);
    }
    const lastChange = d.stage === 'won' || d.stage === 'lost' ? d.closeDate : addDays(today, -r.int(1, 45));
    const dates: CalendarDate[] = [lastChange];
    for (let i = path.length - 2; i > 0; i--) dates.unshift(maxDate(firstDay, addDays(dates[0], -r.int(6, 21))));
    for (let i = 1; i < path.length; i++) {
      add({
        kind: 'stage_change', contactId: null, dealId: d.id, description: stageChangeDescription(path[i - 1], path[i]),
        occurredOn: dates[i - 1], followUpOn: null, done: false, fromStage: path[i - 1], toStage: path[i],
      });
    }
  }

  // 200 notes, calls and emails over the past year: 8 follow-ups due soon, 5 overdue, some done (S3).
  const kinds = ['call', 'email', 'note'] as const;
  const templates = { call: CALLS, email: EMAILS, note: NOTES };
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  for (let i = 0; i < 200; i++) {
    const kind = kinds[i % 3];
    const roll = r.next();
    let contactId: number | null = null;
    let dealId: number | null = null;
    if (roll < 0.5) {
      const d = r.pick(deals);
      dealId = d.id;
      contactId = d.contactId;
    } else if (roll < 0.85) {
      contactId = r.pick(contacts).id;
    } else {
      dealId = r.pick(deals).id;
    }
    const span = Math.max(0, daysBetween(firstDay, today));
    add({
      kind, contactId, dealId, description: fill(r.pick(templates[kind]), contactId),
      occurredOn: addDays(firstDay, r.int(0, span)), followUpOn: null, done: false, fromStage: null, toStage: null,
    });
  }
  // Turn some recent ones into follow-ups, linked to open deals where possible.
  const regular = activities.filter((a) => a.kind !== 'stage_change');
  const followUp = (a: SampleActivity, followUpOn: CalendarDate, done: boolean) => {
    const d = r.pick(openDeals);
    a.dealId = d.id;
    a.contactId = d.contactId;
    a.kind = r.pick(kinds);
    a.description = fill(r.pick(FOLLOW_UPS), a.contactId);
    a.occurredOn = maxDate(firstDay, addDays(minDate(followUpOn, today), -r.int(1, 10)));
    a.followUpOn = followUpOn;
    a.done = done;
  };
  regular.slice(0, 8).forEach((a, i) => followUp(a, addDays(today, i), false));
  regular.slice(8, 13).forEach((a, i) => followUp(a, addDays(today, -(i * 2 + 1)), false));
  regular.slice(13, 25).forEach((a) => followUp(a, addDays(today, -r.int(3, 120)), true));

  return { organizations, contacts, deals, activities };
}

function maxDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return a > b ? a : b;
}

function minDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return a < b ? a : b;
}

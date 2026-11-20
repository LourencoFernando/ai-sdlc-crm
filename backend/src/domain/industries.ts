/** The industries an organization can have (O1). */
export const INDUSTRIES = [
  'Software',
  'Financial services',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Logistics',
  'Construction',
  'Education',
  'Media',
  'Professional services',
  'Hospitality',
  'Energy',
  'Other',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

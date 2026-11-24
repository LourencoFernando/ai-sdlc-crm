const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HTTP = /^https?:\/\//i;

/**
 * Where a saved website links to. One saved without a scheme ("acme.com") goes to https, not to a
 * page of this app; anything that isn't an http or https address isn't linked at all.
 */
export function websiteHref(website: string): string | null {
  const v = website.trim();
  if (!v) return null;
  if (HTTP.test(v)) return v;
  if (SCHEME.test(v) && !/^[^:]+:\d/.test(v)) return null;
  return `https://${v}`;
}

/** The address as shown, without its scheme: "acme.com". */
export function websiteLabel(website: string): string {
  return website.trim().replace(HTTP, '');
}

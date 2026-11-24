import { describe, expect, it } from 'vitest';
import { websiteHref, websiteLabel } from './website';

describe('website links', () => {
  it('links a website saved without a scheme to https, not to a page of this app', () => {
    expect(websiteHref('acme.com')).toBe('https://acme.com');
    expect(websiteHref('www.acme.com/about')).toBe('https://www.acme.com/about');
  });

  it('keeps http and https addresses as they are', () => {
    expect(websiteHref('https://acme.com')).toBe('https://acme.com');
    expect(websiteHref('http://acme.com')).toBe('http://acme.com');
    expect(websiteHref('HTTPS://acme.com')).toBe('HTTPS://acme.com');
  });

  it("doesn't link anything that isn't a web address", () => {
    expect(websiteHref('javascript:alert(1)')).toBeNull();
    expect(websiteHref('ftp://acme.com')).toBeNull();
    expect(websiteHref('  ')).toBeNull();
  });

  it('shows the address without its scheme', () => {
    expect(websiteLabel('https://acme.com')).toBe('acme.com');
    expect(websiteLabel('HTTP://acme.com')).toBe('acme.com');
    expect(websiteLabel('acme.com')).toBe('acme.com');
  });
});

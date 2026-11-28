import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Guards for the color tokens: tokens.css is a copy of the brand reference, colors live only there,
 * and every text and chart pair meets the contrast rules in both modes.
 */

const srcDir = join(__dirname, '..');
const brandFile = join(__dirname, '../../../.claude/skills/brand/DESIGN.md');

type Tokens = Record<string, string>;

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
// Prettier reflows long values and swaps quotes, so compare values without spaces or quote style.
const normalize = (value: string) => value.replace(/\s+/g, '').replace(/"/g, "'").toLowerCase();

function block(source: string, selector: string): Tokens {
  const css = source.replace(/"/g, "'");
  const start = css.indexOf(`${selector.replace(/"/g, "'")} {`);
  if (start < 0) return {};
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const tokens: Tokens = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+|color-scheme)\s*:\s*([^;]+);/g)) tokens[name] = value.trim();
  return tokens;
}

const tokensCss = stripComments(readFileSync(join(__dirname, 'tokens.css'), 'utf8'));
const light = block(tokensCss, ':root');
const dark = block(tokensCss, ':root[data-theme="dark"]');

const brandCss = (() => {
  const md = readFileSync(brandFile, 'utf8');
  const start = md.indexOf('```css', md.indexOf('### CSS Custom Properties'));
  return stripComments(md.slice(start + 6, md.indexOf('```', start + 6)));
})();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(css|tsx?)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
const appFiles = sourceFiles(srcDir).filter((f) => !f.endsWith(join('styles', 'tokens.css')));

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(tokens: Tokens, fg: string, bg: string): number {
  const [a, b] = [luminance(tokens[`--color-${fg}`]), luminance(tokens[`--color-${bg}`])].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const PASTELS = ['mint', 'sky', 'periwinkle-wash', 'lavender', 'apricot-wash', 'aqua', 'peony'];
const CHARTS = ['ocean', 'ultra-violet', 'ember', 'violet', 'forest', 'text-muted', 'alert'];

/** [text, background, minimum ratio], from the brand reference's Contrast section. */
const LIGHT_PAIRS: [string, string, number][] = [
  ...['surface', 'canvas', ...PASTELS].map((bg): [string, string, number] => ['text', bg, 4.5]),
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'canvas', 4.5],
  ['violet-text', 'surface', 4.5],
  ['on-fill', 'violet', 4.5],
  ['on-fill', 'alert-fill', 4.5],
  ['alert', 'surface', 4.5],
  ['alert', 'alert-wash', 4.5],
  ['on-inverse', 'inverse', 4.5],
  ...CHARTS.map((c): [string, string, number] => [c, 'surface', 3]),
];

const DARK_PAIRS: [string, string, number][] = [
  ...['canvas', 'surface', 'surface-raised', 'surface-hover', ...PASTELS].flatMap((bg): [string, string, number][] => [
    ['text', bg, 4.5],
    ['text-muted', bg, 4.5],
  ]),
  ['text-faint', 'surface', 3],
  ...['surface', 'canvas', 'surface-raised', 'periwinkle-wash', 'lavender', 'surface-hover'].map(
    (bg): [string, string, number] => ['violet-text', bg, 4.5],
  ),
  ['on-fill', 'violet', 4.5],
  ['on-fill', 'violet-hover', 4.5],
  ['on-fill', 'alert-fill', 4.5],
  ['on-inverse', 'inverse', 4.5],
  ['alert', 'surface', 4.5],
  ['alert', 'surface-raised', 4.5],
  ['alert', 'alert-wash', 4.5],
  ['forest', 'surface', 4.5],
  ['forest', 'surface-raised', 4.5],
  ...CHARTS.map((c): [string, string, number] => [c, 'surface', 3]),
];

describe('color tokens', () => {
  it('copies every token in the brand reference, light and dark', () => {
    for (const [selector, ours] of [
      [':root', light],
      [':root[data-theme="dark"]', dark],
    ] as const) {
      const brand = block(brandCss, selector);
      expect(Object.keys(brand).length, `brand block ${selector}`).toBeGreaterThan(0);
      for (const [name, value] of Object.entries(brand)) {
        expect(normalize(ours[name] ?? 'missing'), `${selector} ${name}`).toBe(normalize(value));
      }
    }
  });

  it('only redefines light tokens in dark mode, and sets the color scheme in both', () => {
    for (const name of Object.keys(dark)) expect(light, name).toHaveProperty(name);
    expect(light['color-scheme']).toBe('light');
    expect(dark['color-scheme']).toBe('dark');
  });

  it('has no raw colors outside tokens.css', () => {
    const raw = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/i;
    const offenders = appFiles.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [line, i] as const)
        .filter(([line]) => raw.test(line))
        .map(([line, i]) => `${file.slice(srcDir.length + 1)}:${i + 1}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });

  it('defines every color and shadow token the app uses', () => {
    const undefinedNames = appFiles.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/var\((--(?:color|shadow)-[\w-]+)/g)]
        .map(([, name]) => name)
        .filter((name) => !(name in light))
        .map((name) => `${file.slice(srcDir.length + 1)}: ${name}`),
    );
    expect(undefinedNames).toEqual([]);
  });

  it.each([
    ['light', LIGHT_PAIRS, () => light],
    ['dark', DARK_PAIRS, () => ({ ...light, ...dark })],
  ] as const)('meets the contrast rules in %s mode', (_mode, pairs, tokens) => {
    const failing = pairs
      .map(([fg, bg, min]) => ({ pair: `${fg} on ${bg}`, ratio: contrast(tokens(), fg, bg), min }))
      .filter(({ ratio, min }) => !(ratio >= min));
    expect(failing).toEqual([]);
  });
});

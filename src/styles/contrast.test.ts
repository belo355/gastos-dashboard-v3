import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../domain/categories';

// Lê os tokens dos dois temas direto do CSS, para que o teste acompanhe a paleta real.
const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');

function block(source: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of source.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    vars[m[1]!] = m[2]!.toLowerCase();
  }
  return vars;
}

const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
const light = block(css.slice(0, darkStart));
const dark = block(css.slice(darkStart));

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe.each([
  ['claro', light],
  ['escuro', dark],
])('contraste do tema %s', (_name, t) => {
  it('texto tem contraste >= 4,5:1 nas superfícies', () => {
    for (const bg of ['bg', 'surface', 'surface-2']) {
      expect(contrast(t.text!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t['text-muted']!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(t['primary-ink']!, t.primary!)).toBeGreaterThanOrEqual(4.5);
  });

  it('azul de links e ícones (tint) tem contraste >= 4,5:1 nas superfícies e no próprio preenchimento', () => {
    for (const bg of ['bg', 'surface', 'surface-2', 'tint-fill']) {
      expect(contrast(t.tint!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('botão de perigo: texto (cor da superfície) sobre o vermelho >= 4,5:1', () => {
    expect(contrast(t.surface!, t.danger!)).toBeGreaterThanOrEqual(4.5);
  });

  it('foco visível tem contraste >= 3:1 no fundo e na superfície', () => {
    for (const bg of ['bg', 'surface']) {
      expect(contrast(t.focus!, t[bg]!)).toBeGreaterThanOrEqual(3);
    }
  });

  it('estados do orçamento têm contraste >= 4,5:1 no próprio fundo e na superfície', () => {
    for (const s of ['ok', 'warning', 'danger']) {
      expect(contrast(t[s]!, t[`${s}-bg`]!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t[s]!, t.surface!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cada categoria: texto sobre a cor >= 4,5:1 e a cor sobre o fundo >= 3:1', () => {
    for (const id of CATEGORY_IDS) {
      const c = t[`cat-${id}`];
      expect(c, `token --cat-${id}`).toBeDefined();
      expect(contrast(t['cat-ink']!, c!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c!, t.surface!)).toBeGreaterThanOrEqual(3);
      expect(contrast(c!, t.bg!)).toBeGreaterThanOrEqual(3);
    }
  });
});

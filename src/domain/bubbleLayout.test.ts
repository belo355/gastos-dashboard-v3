import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CATEGORY_IDS } from './categories';
import { layoutBubbles } from './bubbleLayout';
import { summarizeMonth } from './summary';

function check(values: number[], w: number, h: number) {
  const s = summarizeMonth(
    values.map((amountCents, i) => ({ categoryId: CATEGORY_IDS[i]!, amountCents })),
  );
  const nodes = layoutBubbles(s.categories, w, h);
  expect(nodes).toHaveLength(values.length);

  // Área proporcional ao valor (±1%).
  const ref = nodes[0]!;
  for (const n of nodes) {
    const areaRatio = (n.r * n.r) / (ref.r * ref.r);
    const valueRatio = n.totalCents / ref.totalCents;
    expect(Math.abs(areaRatio / valueRatio - 1)).toBeLessThan(0.01);
  }
  // Sem sobreposição.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 1e-6);
    }
  }
  // Dentro do contêiner.
  for (const n of nodes) {
    expect(n.x - n.r).toBeGreaterThanOrEqual(-1e-6);
    expect(n.y - n.r).toBeGreaterThanOrEqual(-1e-6);
    expect(n.x + n.r).toBeLessThanOrEqual(w + 1e-6);
    expect(n.y + n.r).toBeLessThanOrEqual(h + 1e-6);
  }
  return nodes;
}

describe('TU-18 — layoutBubbles mantém área proporcional e sem sobreposição', () => {
  it('3 categorias', () => {
    check([82000, 51300, 51290], 340, 300);
  });

  it('1 e 2 categorias continuam válidas', () => {
    const [one] = check([1000], 300, 300);
    expect(one!.x).toBeCloseTo(150);
    check([1000, 10], 320, 240);
  });

  it('12 categorias com valores muito diferentes', () => {
    check([500000, 1, 20, 3000, 45000, 7, 99999, 12345, 600, 80, 4000, 250], 360, 360);
  });

  it('propriedade: vale para quaisquer valores e tamanhos', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 9_999_999 }), { minLength: 1, maxLength: 12 }),
        fc.integer({ min: 120, max: 900 }),
        fc.integer({ min: 120, max: 900 }),
        (values, w, h) => {
          check(values, w, h);
        },
      ),
      { numRuns: 60 },
    );
  });

  it('lista vazia ou contêiner sem tamanho', () => {
    expect(layoutBubbles([], 300, 300)).toEqual([]);
    expect(
      layoutBubbles(summarizeMonth([{ categoryId: 'lazer', amountCents: 1 }]).categories, 0, 300),
    ).toEqual([]);
  });
});

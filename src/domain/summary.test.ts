import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CATEGORY_IDS, type CategoryId } from './categories';
import { largestRemainderPercents, summarizeMonth } from './summary';

const e = (categoryId: CategoryId, amountCents: number) => ({ categoryId, amountCents });

describe('TU-04 — summarizeMonth agrega, ordena e conta', () => {
  it('soma por categoria, ranking desc e contagem', () => {
    const s = summarizeMonth([
      e('mercado', 50000),
      e('transporte', 1290),
      e('mercado', 32000),
      e('lazer', 51300),
      e('transporte', 50000),
    ]);
    expect(s.totalCents).toBe(184590);
    expect(s.count).toBe(5);
    expect(s.categories.map((c) => [c.categoryId, c.totalCents, c.count, c.rank])).toEqual([
      ['mercado', 82000, 2, 1],
      ['lazer', 51300, 1, 2],
      ['transporte', 51290, 2, 3],
    ]);
    expect(s.categories.reduce((a, c) => a + c.totalCents, 0)).toBe(s.totalCents);
  });

  it('desempata pelo nome da categoria', () => {
    const s = summarizeMonth([e('saude', 100), e('alimentacao', 100), e('lazer', 100)]);
    expect(s.categories.map((c) => c.categoryId)).toEqual(['alimentacao', 'lazer', 'saude']);
  });
});

describe('TU-05 — Percentuais pelo maior resto somam 100,0', () => {
  it('3 categorias iguais → 33,4 / 33,3 / 33,3', () => {
    const s = summarizeMonth([e('alimentacao', 100), e('lazer', 100), e('saude', 100)]);
    expect(s.categories.map((c) => c.percent)).toEqual([33.4, 33.3, 33.3]);
  });

  it('propriedade: a soma é sempre 100,0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            categoryId: fc.constantFrom(...CATEGORY_IDS),
            amountCents: fc.integer({ min: 1, max: 99_999_999 }),
          }),
          { minLength: 1, maxLength: 200 },
        ),
        (expenses) => {
          const s = summarizeMonth(expenses);
          const sumTenths = s.categories.reduce((a, c) => a + Math.round(c.percent * 10), 0);
          expect(sumTenths).toBe(1000);
          expect(s.categories.reduce((a, c) => a + c.totalCents, 0)).toBe(s.totalCents);
        },
      ),
    );
  });

  it('total zero devolve zeros', () => {
    expect(largestRemainderPercents([0, 0])).toEqual([0, 0]);
  });
});

describe('TU-06 — summarizeMonth com lista vazia', () => {
  it('devolve resumo zerado', () => {
    expect(summarizeMonth([])).toEqual({ totalCents: 0, count: 0, categories: [] });
  });
});

import { compareCategoryNames, type CategoryId } from './categories';
import type { Expense, MonthSummary } from './types';

type Summable = Pick<Expense, 'categoryId' | 'amountCents'>;

/**
 * Distribui 100,0% entre os valores pelo método do maior resto, em décimos de ponto.
 * A soma é sempre exatamente 100,0 (quando o total é > 0).
 */
export function largestRemainderPercents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const UNITS = 1000;
  const exact = values.map((v) => (v * UNITS) / total);
  const floors = exact.map(Math.floor);
  let left = UNITS - floors.reduce((a, b) => a + b, 0);
  // Desempate pela ordem de entrada (que já é o ranking).
  const order = exact
    .map((e, i) => ({ i, r: e - floors[i]! }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]! += 1;
    left -= 1;
  }
  return floors.map((u) => u / 10);
}

export function summarizeMonth(expenses: readonly Summable[]): MonthSummary {
  const totals = new Map<CategoryId, { total: number; count: number }>();
  let totalCents = 0;
  for (const e of expenses) {
    const t = totals.get(e.categoryId) ?? { total: 0, count: 0 };
    t.total += e.amountCents;
    t.count += 1;
    totals.set(e.categoryId, t);
    totalCents += e.amountCents;
  }

  const ranked = [...totals.entries()]
    .map(([categoryId, t]) => ({ categoryId, totalCents: t.total, count: t.count }))
    .sort(
      (a, b) => b.totalCents - a.totalCents || compareCategoryNames(a.categoryId, b.categoryId),
    );

  const percents = largestRemainderPercents(ranked.map((c) => c.totalCents));

  return {
    totalCents,
    count: expenses.length,
    categories: ranked.map((c, i) => ({ ...c, percent: percents[i]!, rank: i + 1 })),
  };
}

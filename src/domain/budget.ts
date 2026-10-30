import type { CategoryId } from './categories';
import type { BudgetProgress, BudgetRecord, BudgetState, MonthKey } from './types';

export const WARNING_RATIO = 0.8;

export function budgetStatus(spentCents: number, limitCents: number): BudgetProgress {
  const ratio = limitCents > 0 ? spentCents / limitCents : 0;
  const status: BudgetState = ratio < WARNING_RATIO ? 'ok' : ratio <= 1 ? 'warning' : 'over';
  return {
    spentCents,
    limitCents,
    ratio,
    status,
    remainingCents: Math.max(limitCents - spentCents, 0),
    excessCents: Math.max(spentCents - limitCents, 0),
  };
}

/** Percentual inteiro para exibição (86 para 0,86). */
export function budgetPercent(progress: BudgetProgress): number {
  return Math.round(progress.ratio * 100);
}

/** Devolve a nova faixa quando o lançamento fez a categoria entrar em alerta ou estourar. */
export function detectThresholdCrossing(
  before: BudgetProgress,
  after: BudgetProgress,
): 'warning' | 'over' | null {
  if (before.status === after.status) return null;
  if (after.status === 'warning' && before.status === 'ok') return 'warning';
  if (after.status === 'over') return 'over';
  return null;
}

/**
 * Limite vigente por categoria em um mês: o registro com o maior `effectiveFrom <= month`.
 * Um registro com `limitCents: null` remove o limite a partir dele.
 */
export function resolveBudgets(
  records: readonly BudgetRecord[],
  month: MonthKey,
): Map<CategoryId, number> {
  const latest = new Map<CategoryId, BudgetRecord>();
  for (const r of records) {
    if (r.effectiveFrom > month) continue;
    const cur = latest.get(r.categoryId);
    if (!cur || r.effectiveFrom > cur.effectiveFrom) latest.set(r.categoryId, r);
  }
  const result = new Map<CategoryId, number>();
  for (const [cat, r] of latest) {
    if (r.limitCents !== null && r.limitCents > 0) result.set(cat, r.limitCents);
  }
  return result;
}

export function budgetRecordId(walletId: string, categoryId: CategoryId, from: MonthKey): string {
  return `${walletId}:${categoryId}:${from}`;
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { budgetStatus, resolveBudgets } from '../domain/budget';
import { CATEGORIES, type CategoryId } from '../domain/categories';
import type { BudgetProgress, BudgetRecord, Expense, MonthKey } from '../domain/types';

export interface BudgetRow {
  categoryId: CategoryId;
  progress: BudgetProgress;
}

export interface BudgetsData {
  /** Categorias com limite vigente, na ordem do catálogo. */
  rows: BudgetRow[];
  limits: Map<CategoryId, number>;
  spentByCategory: Map<CategoryId, number>;
  totals: {
    budgetedCents: number;
    spentCents: number;
    remainingCents: number;
    excessCents: number;
  };
}

export function computeBudgets(
  records: BudgetRecord[],
  expenses: Pick<Expense, 'categoryId' | 'amountCents'>[],
  month: MonthKey,
): BudgetsData {
  const limits = resolveBudgets(records, month);
  const spentByCategory = new Map<CategoryId, number>();
  for (const e of expenses)
    spentByCategory.set(e.categoryId, (spentByCategory.get(e.categoryId) ?? 0) + e.amountCents);

  const rows: BudgetRow[] = [];
  let budgetedCents = 0;
  let spentCents = 0;
  for (const c of CATEGORIES) {
    const limit = limits.get(c.id);
    if (limit === undefined) continue;
    const spent = spentByCategory.get(c.id) ?? 0;
    rows.push({ categoryId: c.id, progress: budgetStatus(spent, limit) });
    budgetedCents += limit;
    spentCents += spent;
  }
  return {
    rows,
    limits,
    spentByCategory,
    totals: {
      budgetedCents,
      spentCents,
      remainingCents: Math.max(budgetedCents - spentCents, 0),
      excessCents: Math.max(spentCents - budgetedCents, 0),
    },
  };
}

/** Orçamentos vigentes no mês e o progresso de cada categoria; reativo. */
export function useBudgets(walletId: string, month: MonthKey): BudgetsData | undefined {
  return useLiveQuery(async () => {
    const [records, expenses] = await Promise.all([
      db.budgets.where('walletId').equals(walletId).toArray(),
      db.expenses.where('[walletId+month]').equals([walletId, month]).toArray(),
    ]);
    return computeBudgets(records, expenses, month);
  }, [walletId, month]);
}

/** Progresso do orçamento de uma categoria num mês (null se não houver limite). */
export async function readBudgetProgress(
  walletId: string,
  categoryId: CategoryId,
  month: MonthKey,
): Promise<BudgetProgress | null> {
  const [records, expenses] = await Promise.all([
    db.budgets.where('[walletId+categoryId]').equals([walletId, categoryId]).toArray(),
    db.expenses
      .where('[walletId+month+categoryId]')
      .equals([walletId, month, categoryId])
      .toArray(),
  ]);
  const limit = resolveBudgets(records, month).get(categoryId);
  if (limit === undefined) return null;
  return budgetStatus(
    expenses.reduce((a, e) => a + e.amountCents, 0),
    limit,
  );
}

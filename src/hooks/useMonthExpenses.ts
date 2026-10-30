import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { byDateDesc } from '../data/expenseRepository';
import type { Expense, MonthKey } from '../domain/types';

/** Lançamentos do mês da carteira, mais recentes primeiro; undefined enquanto carrega. */
export function useMonthExpenses(walletId: string, month: MonthKey): Expense[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.expenses.where('[walletId+month]').equals([walletId, month]).toArray()).sort(
        byDateDesc,
      ),
    [walletId, month],
  );
}

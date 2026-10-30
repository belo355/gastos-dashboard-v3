import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { compareMonths } from '../domain/comparison';
import { addMonths } from '../domain/dates';
import { summarizeMonth } from '../domain/summary';
import type { Expense, MonthComparison, MonthKey, MonthSummary } from '../domain/types';

export interface MonthSummaryData {
  expenses: Expense[];
  summary: MonthSummary;
  previousTotalCents: number;
  comparison: MonthComparison;
}

/**
 * Resumo do mês e comparação com o anterior; reage a qualquer gravação no IndexedDB.
 * O cálculo roda dentro da consulta, então o objeto só muda quando os dados mudam.
 */
export function useMonthSummary(walletId: string, month: MonthKey): MonthSummaryData | undefined {
  return useLiveQuery(async () => {
    const [current, previous] = await Promise.all([
      db.expenses.where('[walletId+month]').equals([walletId, month]).toArray(),
      db.expenses
        .where('[walletId+month]')
        .equals([walletId, addMonths(month, -1)])
        .toArray(),
    ]);
    const summary = summarizeMonth(current);
    const previousTotalCents = previous.reduce((a, e) => a + e.amountCents, 0);
    return {
      expenses: current,
      summary,
      previousTotalCents,
      comparison: compareMonths(summary.totalCents, previousTotalCents),
    };
  }, [walletId, month]);
}

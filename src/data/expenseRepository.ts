import { Dexie } from 'dexie';
import { monthKey } from '../domain/dates';
import { validateExpenseInput } from '../domain/expenseSchema';
import type { Expense, ExpenseInput, MonthKey } from '../domain/types';
import { AppError } from '../lib/errors';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import type { ExpenseRepository } from './repositories';
import { guard } from './storageGuard';

function validated(input: ExpenseInput): ExpenseInput {
  const r = validateExpenseInput(input);
  if (!r.ok) {
    throw new AppError('invalid_input', { details: Object.values(r.errors) as string[] });
  }
  return r.value;
}

/** Mais recente primeiro; no mesmo dia, o criado por último primeiro. */
export function byDateDesc(a: Expense, b: Expense): number {
  return (
    b.date.localeCompare(a.date) ||
    b.createdAt.localeCompare(a.createdAt) ||
    b.id.localeCompare(a.id)
  );
}

function toRecord(input: ExpenseInput, id: string, createdAt: string, updatedAt: string): Expense {
  return {
    id,
    walletId: input.walletId,
    date: input.date,
    month: monthKey(input.date),
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    description: input.description ?? null,
    createdAt,
    updatedAt,
  };
}

export const expenseRepository: ExpenseRepository = {
  listByMonth(walletId, month) {
    return guard('expenses.listByMonth', async () => {
      const rows = await db.expenses.where('[walletId+month]').equals([walletId, month]).toArray();
      return rows.sort(byDateDesc);
    });
  },

  monthsWithData(walletId) {
    return guard('expenses.monthsWithData', async () => {
      const keys = await db.expenses
        .where('[walletId+month]')
        .between([walletId, Dexie.minKey], [walletId, Dexie.maxKey])
        .uniqueKeys();
      return (keys as unknown as [string, MonthKey][]).map((k) => k[1]).sort();
    });
  },

  async create(input) {
    const value = validated(input);
    return guard('expenses.create', async () => {
      const now = nowIso();
      const record = toRecord(value, newId(), now, now);
      await db.expenses.add(record);
      return record;
    });
  },

  async update(id, input) {
    const value = validated(input);
    return guard('expenses.update', () =>
      db.transaction('rw', db.expenses, async () => {
        const current = await db.expenses.get(id);
        if (!current) throw new AppError('not_found');
        await db.expenses.put(toRecord(value, id, current.createdAt, nowIso()));
      }),
    );
  },

  remove(id) {
    return guard('expenses.remove', () => db.expenses.delete(id));
  },

  replaceMonths(walletId, byMonth) {
    return guard('expenses.replaceMonths', () =>
      db.transaction('rw', db.expenses, async () => {
        const now = nowIso();
        for (const [month, inputs] of byMonth) {
          await db.expenses.where('[walletId+month]').equals([walletId, month]).delete();
          const records = inputs.map((i) => {
            const value = validated({ ...i, walletId });
            if (monthKey(value.date) !== month) throw new AppError('invalid_input');
            return toRecord(value, newId(), now, now);
          });
          await db.expenses.bulkAdd(records);
        }
      }),
    );
  },
};

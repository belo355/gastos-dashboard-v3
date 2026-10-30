import { budgetRecordId } from '../domain/budget';
import { isValidMonth } from '../domain/dates';
import { MAX_AMOUNT_CENTS } from '../domain/money';
import { AppError } from '../lib/errors';
import { db } from './db';
import type { BudgetRepository } from './repositories';
import { guard } from './storageGuard';

export const budgetRepository: BudgetRepository = {
  listForWallet(walletId) {
    return guard('budgets.list', () => db.budgets.where('walletId').equals(walletId).toArray());
  },

  async setLimit(walletId, categoryId, from, cents) {
    if (!isValidMonth(from)) throw new AppError('invalid_input');
    if (
      cents !== null &&
      (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS)
    ) {
      throw new AppError('invalid_input');
    }
    return guard('budgets.setLimit', async () => {
      // O id composto torna a gravação idempotente por mês de vigência.
      await db.budgets.put({
        id: budgetRecordId(walletId, categoryId, from),
        walletId,
        categoryId,
        effectiveFrom: from,
        limitCents: cents,
      });
    });
  },
};

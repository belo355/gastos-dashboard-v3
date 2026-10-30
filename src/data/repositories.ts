import type { CategoryId } from '../domain/categories';
import type { BudgetRecord, Expense, ExpenseInput, MonthKey, Wallet } from '../domain/types';

export interface WalletRepository {
  list(): Promise<Wallet[]>;
  create(name: string, options?: { isSample?: boolean }): Promise<Wallet>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ExpenseRepository {
  listByMonth(walletId: string, month: MonthKey): Promise<Expense[]>;
  monthsWithData(walletId: string): Promise<MonthKey[]>;
  create(input: ExpenseInput): Promise<Expense>;
  update(id: string, input: ExpenseInput): Promise<void>;
  remove(id: string): Promise<void>;
  replaceMonths(
    walletId: string,
    byMonth: Map<MonthKey, Omit<ExpenseInput, 'walletId'>[]>,
  ): Promise<void>;
}

export interface BudgetRepository {
  listForWallet(walletId: string): Promise<BudgetRecord[]>;
  setLimit(
    walletId: string,
    categoryId: CategoryId,
    from: MonthKey,
    cents: number | null,
  ): Promise<void>;
}

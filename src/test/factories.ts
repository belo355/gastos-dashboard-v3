import { budgetRecordId } from '../domain/budget';
import type { CategoryId } from '../domain/categories';
import { monthKey } from '../domain/dates';
import type { BudgetRecord, Expense, ExpenseInput, Wallet } from '../domain/types';
import { db } from '../data/db';
import { settingsRepository } from '../data/settingsRepository';

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function makeWallet(over: Partial<Wallet> = {}): Wallet {
  return {
    id: nextId('w'),
    name: `Carteira ${seq}`,
    isSample: false,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, seq)).toISOString(),
    ...over,
  };
}

export function makeExpenseInput(over: Partial<ExpenseInput> = {}): ExpenseInput {
  return {
    walletId: 'w-default',
    date: '2026-10-29',
    categoryId: 'mercado',
    amountCents: 5000,
    description: null,
    ...over,
  };
}

export function makeExpense(over: Partial<Expense> = {}): Expense {
  const date = over.date ?? '2026-10-29';
  const createdAt = new Date(Date.UTC(2026, 9, 1, 0, 0, ++seq)).toISOString();
  return {
    id: nextId('e'),
    walletId: 'w-default',
    date,
    month: monthKey(date),
    categoryId: 'mercado',
    amountCents: 5000,
    description: null,
    createdAt,
    updatedAt: createdAt,
    ...over,
  };
}

export function makeBudget(
  walletId: string,
  categoryId: CategoryId,
  effectiveFrom: string,
  limitCents: number | null,
): BudgetRecord {
  return {
    id: budgetRecordId(walletId, categoryId, effectiveFrom),
    walletId,
    categoryId,
    effectiveFrom,
    limitCents,
  };
}

/** Limpa o banco entre testes. */
export async function resetDb(): Promise<void> {
  db.close();
  await db.delete();
  await db.open();
}

/** Banco limpo, carteira padrão criada e boas-vindas concluídas (para testes de tela). */
export async function readyApp(): Promise<string> {
  await resetDb();
  const s = await settingsRepository.ensureInitialized();
  await settingsRepository.update({ onboardingDone: true });
  return s.activeWalletId;
}

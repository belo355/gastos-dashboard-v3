import { budgetRecordId } from '../domain/budget';
import type { CategoryId } from '../domain/categories';
import { addMonths, currentMonth, lastDayOfMonth, monthKey, today } from '../domain/dates';
import type { BudgetRecord, Expense, Wallet } from '../domain/types';
import { walletNameKey } from '../domain/walletName';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import { settingsRepository } from './settingsRepository';
import { guard } from './storageGuard';

export const SAMPLE_WALLET_NAME = 'Exemplo';

/** [dia, categoria, valor em centavos, descrição] — dados fictícios. */
const TEMPLATE: [number, CategoryId, number, string][] = [
  [1, 'moradia', 145000, 'Aluguel'],
  [2, 'mercado', 28740, 'Compras do mês'],
  [3, 'transporte', 1760, 'Metrô'],
  [4, 'alimentacao', 3290, 'Almoço'],
  [5, 'saude', 8990, 'Farmácia'],
  [6, 'lazer', 6000, 'Cinema'],
  [7, 'alimentacao', 2450, 'Lanche'],
  [8, 'carro', 22000, 'Combustível'],
  [9, 'mercado', 9435, 'Feira'],
  [10, 'educacao', 18900, 'Curso on-line'],
  [11, 'jogos', 12990, 'Jogo'],
  [12, 'vestuario', 15990, 'Camiseta'],
  [13, 'familia', 8000, 'Presente'],
  [14, 'transporte', 2380, 'Aplicativo de corrida'],
  [15, 'alimentacao', 5870, 'Jantar'],
  [16, 'mercado', 6210, 'Padaria e mercado'],
  [17, 'outros', 2500, 'Papelaria'],
  [18, 'lazer', 4500, 'Parque'],
  [20, 'alimentacao', 3100, 'Almoço'],
  [22, 'mercado', 11870, 'Reposição'],
  [24, 'transporte', 1760, 'Metrô'],
  [26, 'saude', 4500, 'Consulta'],
];

function sampleExpenses(
  walletId: string,
  month: string,
  maxDate: string,
  factor: number,
): Expense[] {
  const last = lastDayOfMonth(month);
  const now = nowIso();
  return TEMPLATE.map(([day, categoryId, cents, description]) => {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return { date, categoryId, cents, description };
  })
    .filter((e) => e.date <= last && e.date <= maxDate)
    .map((e) => ({
      id: newId(),
      walletId,
      date: e.date,
      month: monthKey(e.date),
      categoryId: e.categoryId,
      amountCents: Math.round(e.cents * factor),
      description: e.description,
      createdAt: now,
      updatedAt: now,
    }));
}

/**
 * Cria a carteira de exemplo (dados fictícios do mês atual e do anterior, com dois limites)
 * e a deixa ativa. Ela é uma carteira comum, marcada com isSample, e pode ser excluída.
 */
export async function createSampleWallet(): Promise<Wallet> {
  return guard('sample.create', () =>
    db.transaction('rw', db.wallets, db.expenses, db.budgets, db.settings, async () => {
      const taken = new Set((await db.wallets.toArray()).map((w) => walletNameKey(w.name)));
      let name = SAMPLE_WALLET_NAME;
      for (let i = 2; taken.has(walletNameKey(name)); i++) name = `${SAMPLE_WALLET_NAME} ${i}`;

      const wallet: Wallet = { id: newId(), name, isSample: true, createdAt: nowIso() };
      await db.wallets.add(wallet);
      const month = currentMonth();
      const prev = addMonths(month, -1);
      await db.expenses.bulkAdd([
        ...sampleExpenses(wallet.id, month, today(), 1),
        ...sampleExpenses(wallet.id, prev, lastDayOfMonth(prev), 1.08),
      ]);
      const budgets: BudgetRecord[] = [
        {
          id: budgetRecordId(wallet.id, 'mercado', prev),
          walletId: wallet.id,
          categoryId: 'mercado',
          effectiveFrom: prev,
          limitCents: 60000,
        },
        {
          id: budgetRecordId(wallet.id, 'alimentacao', prev),
          walletId: wallet.id,
          categoryId: 'alimentacao',
          effectiveFrom: prev,
          limitCents: 15000,
        },
      ];
      await db.budgets.bulkAdd(budgets);
      await settingsRepository.setActiveWallet(wallet.id);
      return wallet;
    }),
  );
}

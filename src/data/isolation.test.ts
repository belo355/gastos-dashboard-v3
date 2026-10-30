import { beforeEach, describe, expect, it } from 'vitest';
import { resolveBudgets } from '../domain/budget';
import { makeExpenseInput, resetDb } from '../test/factories';
import { budgetRepository } from './budgetRepository';
import { expenseRepository } from './expenseRepository';
import { walletRepository } from './walletRepository';

beforeEach(resetDb);

describe('TI-04 — Isolamento por carteira', () => {
  it('consultas de "Viagem" não retornam lançamentos nem limites de "Pessoal"', async () => {
    const pessoal = await walletRepository.create('Pessoal');
    const viagem = await walletRepository.create('Viagem');

    await expenseRepository.create(makeExpenseInput({ walletId: pessoal.id, amountCents: 1000 }));
    await expenseRepository.create(makeExpenseInput({ walletId: pessoal.id, amountCents: 2000 }));
    const v = await expenseRepository.create(
      makeExpenseInput({ walletId: viagem.id, amountCents: 3000 }),
    );
    await budgetRepository.setLimit(pessoal.id, 'mercado', '2026-10', 50000);

    expect(await expenseRepository.listByMonth(viagem.id, '2026-10')).toEqual([v]);
    expect(await expenseRepository.monthsWithData(viagem.id)).toEqual(['2026-10']);
    expect(await budgetRepository.listForWallet(viagem.id)).toEqual([]);
    expect(resolveBudgets(await budgetRepository.listForWallet(viagem.id), '2026-10').size).toBe(0);
    expect(await expenseRepository.listByMonth(pessoal.id, '2026-10')).toHaveLength(2);
  });
});

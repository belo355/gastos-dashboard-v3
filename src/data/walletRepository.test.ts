import { beforeEach, describe, expect, it } from 'vitest';
import { makeExpenseInput, resetDb } from '../test/factories';
import { budgetRepository } from './budgetRepository';
import { db } from './db';
import { expenseRepository } from './expenseRepository';
import { walletRepository as repo } from './walletRepository';

beforeEach(resetDb);

describe('TI-03 — walletRepository garante nome único e exclui em cascata', () => {
  it('criar duplicado lança wallet_name_taken e nada é criado', async () => {
    await repo.create('Casa');
    await expect(repo.create('casa')).rejects.toMatchObject({
      code: 'wallet_name_taken',
      message: 'Já existe uma carteira com esse nome',
    });
    await expect(repo.create('CÁSA ')).rejects.toMatchObject({ code: 'wallet_name_taken' });
    expect(await db.wallets.count()).toBe(1);
  });

  it('nome vazio ou longo é rejeitado', async () => {
    await expect(repo.create(' ')).rejects.toMatchObject({
      code: 'invalid_name',
      message: 'Informe o nome da carteira',
    });
    await expect(repo.create('x'.repeat(41))).rejects.toMatchObject({
      code: 'invalid_name',
      message: 'Use até 40 caracteres',
    });
  });

  it('renomear valida unicidade e ignora a própria carteira', async () => {
    const casa = await repo.create('Casa');
    await repo.create('Viagem');
    await expect(repo.rename(casa.id, 'viagem')).rejects.toMatchObject({
      code: 'wallet_name_taken',
    });
    await repo.rename(casa.id, 'CASA');
    await repo.rename(casa.id, 'Lar');
    // Ordena aqui: criadas no mesmo milissegundo, a ordem de list() empata e varia.
    expect((await repo.list()).map((w) => w.name).sort()).toEqual(['Lar', 'Viagem']);
    await expect(repo.rename('nao-existe', 'X')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('remove apaga lançamentos e orçamentos da carteira e mantém os das demais', async () => {
    const a = await repo.create('Pessoal');
    const b = await repo.create('Viagem');
    await expenseRepository.create(makeExpenseInput({ walletId: a.id }));
    await expenseRepository.create(makeExpenseInput({ walletId: b.id }));
    await budgetRepository.setLimit(a.id, 'mercado', '2026-10', 100);
    await budgetRepository.setLimit(b.id, 'mercado', '2026-10', 200);

    await repo.remove(a.id);

    expect((await repo.list()).map((w) => w.id)).toEqual([b.id]);
    expect(await db.expenses.where('walletId').equals(a.id).count()).toBe(0);
    expect(await db.budgets.where('walletId').equals(a.id).count()).toBe(0);
    expect(await db.expenses.where('walletId').equals(b.id).count()).toBe(1);
    expect(await db.budgets.where('walletId').equals(b.id).count()).toBe(1);
  });
});

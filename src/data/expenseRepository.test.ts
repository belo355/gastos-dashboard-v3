import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/errors';
import { makeExpenseInput, resetDb } from '../test/factories';
import { db } from './db';
import { expenseRepository as repo } from './expenseRepository';

beforeEach(resetDb);
afterEach(() => vi.useRealTimers());

describe('TI-01 — expenseRepository cria, lista por mês, edita e exclui', () => {
  it('cria e lista no mês certo, com month derivado e descrição null', async () => {
    const created = await repo.create(
      makeExpenseInput({ walletId: 'w1', date: '2026-10-29', amountCents: 2590 }),
    );
    expect(created.month).toBe('2026-10');
    expect(created.description).toBeNull();
    expect(created.createdAt).toBe(created.updatedAt);

    expect(await repo.listByMonth('w1', '2026-10')).toEqual([created]);
    expect(await repo.listByMonth('w1', '2026-09')).toEqual([]);
  });

  it('ordena por data desc e, no mesmo dia, pelo mais recente', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    const a = await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-10' }));
    vi.setSystemTime(new Date('2026-10-29T11:00:00Z'));
    const b = await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-20' }));
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    const c = await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-20' }));
    expect((await repo.listByMonth('w1', '2026-10')).map((e) => e.id)).toEqual([c.id, b.id, a.id]);
  });

  it('edição atualiza campos e updatedAt, preservando createdAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'));
    const e = await repo.create(makeExpenseInput({ walletId: 'w1' }));
    vi.setSystemTime(new Date('2026-10-29T10:05:00Z'));
    await repo.update(
      e.id,
      makeExpenseInput({ walletId: 'w1', amountCents: 9990, description: 'Feira' }),
    );
    const [updated] = await repo.listByMonth('w1', '2026-10');
    expect(updated).toMatchObject({
      amountCents: 9990,
      description: 'Feira',
      createdAt: e.createdAt,
    });
    expect(updated!.updatedAt > e.updatedAt).toBe(true);
  });

  it('após remove, não aparece mais', async () => {
    const e = await repo.create(makeExpenseInput({ walletId: 'w1' }));
    await repo.remove(e.id);
    expect(await repo.listByMonth('w1', '2026-10')).toEqual([]);
  });

  it('rejeita entrada inválida e edição de item inexistente', async () => {
    await expect(repo.create(makeExpenseInput({ amountCents: 0 }))).rejects.toMatchObject({
      code: 'invalid_input',
    });
    await expect(repo.update('nao-existe', makeExpenseInput())).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('monthsWithData lista os meses da carteira, ordenados e sem repetir', async () => {
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-01' }));
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-09-15' }));
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-20' }));
    await repo.create(makeExpenseInput({ walletId: 'w2', date: '2026-08-01' }));
    expect(await repo.monthsWithData('w1')).toEqual(['2026-09', '2026-10']);
  });
});

describe('TI-02 — Alterar a data muda o mês do lançamento', () => {
  it('de 2026-10-31 para 2026-11-01 sai de outubro e entra em novembro', async () => {
    const e = await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-31' }));
    await repo.update(e.id, makeExpenseInput({ walletId: 'w1', date: '2026-11-01' }));
    expect(await repo.listByMonth('w1', '2026-10')).toEqual([]);
    const nov = await repo.listByMonth('w1', '2026-11');
    expect(nov).toHaveLength(1);
    expect(nov[0]).toMatchObject({ id: e.id, month: '2026-11' });
  });
});

describe('falha de armazenamento', () => {
  it('converte erro de cota em storage_quota', async () => {
    const quota = Object.assign(new Error('cheio'), { name: 'QuotaExceededError' });
    const spy = vi
      .spyOn(db.expenses, 'add')
      .mockRejectedValueOnce(
        Object.assign(new Error('abort'), { name: 'AbortError', inner: quota }),
      );
    const err = await repo.create(makeExpenseInput()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('storage_quota');
    spy.mockRestore();
  });
});

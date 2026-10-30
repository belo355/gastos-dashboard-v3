import { beforeEach, describe, expect, it } from 'vitest';
import { resolveBudgets } from '../domain/budget';
import { resetDb } from '../test/factories';
import { budgetRepository as repo } from './budgetRepository';

beforeEach(resetDb);

describe('TI-05 — budgetRepository.setLimit é idempotente e versionado', () => {
  it('salvar duas vezes no mesmo mês sobrescreve', async () => {
    await repo.setLimit('w1', 'mercado', '2026-10', 50000);
    await repo.setLimit('w1', 'mercado', '2026-10', 60000);
    const records = await repo.listForWallet('w1');
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ effectiveFrom: '2026-10', limitCents: 60000 });
  });

  it('salvar em outro mês cria nova vigência sem reescrever o histórico', async () => {
    await repo.setLimit('w1', 'mercado', '2026-10', 50000);
    await repo.setLimit('w1', 'mercado', '2026-12', 70000);
    const records = await repo.listForWallet('w1');
    expect(records).toHaveLength(2);
    expect(resolveBudgets(records, '2026-11').get('mercado')).toBe(50000);
    expect(resolveBudgets(records, '2026-12').get('mercado')).toBe(70000);
  });

  it('null remove a partir do mês', async () => {
    await repo.setLimit('w1', 'mercado', '2026-10', 50000);
    await repo.setLimit('w1', 'mercado', '2026-11', null);
    const records = await repo.listForWallet('w1');
    expect(resolveBudgets(records, '2026-10').get('mercado')).toBe(50000);
    expect(resolveBudgets(records, '2026-11').has('mercado')).toBe(false);
  });

  it('rejeita mês ou valor inválido', async () => {
    await expect(repo.setLimit('w1', 'mercado', '2026-13', 100)).rejects.toMatchObject({
      code: 'invalid_input',
    });
    await expect(repo.setLimit('w1', 'mercado', '2026-10', 0)).rejects.toMatchObject({
      code: 'invalid_input',
    });
    await expect(repo.setLimit('w1', 'mercado', '2026-10', 1.5)).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });
});

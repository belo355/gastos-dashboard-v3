import { describe, expect, it } from 'vitest';
import {
  budgetPercent,
  budgetRecordId,
  budgetStatus,
  detectThresholdCrossing,
  resolveBudgets,
} from './budget';
import type { BudgetRecord } from './types';

describe('TU-08 — budgetStatus aplica as faixas', () => {
  it('32000/50000 → ok, 64%, restam 18000', () => {
    const p = budgetStatus(32000, 50000);
    expect(p).toEqual({
      spentCents: 32000,
      limitCents: 50000,
      ratio: 0.64,
      status: 'ok',
      remainingCents: 18000,
      excessCents: 0,
    });
    expect(budgetPercent(p)).toBe(64);
  });

  it('43000 → warning (0,86); 40000 → warning (limite de 80%)', () => {
    const p = budgetStatus(43000, 50000);
    expect(p.status).toBe('warning');
    expect(p.ratio).toBeCloseTo(0.86);
    expect(budgetPercent(p)).toBe(86);
    expect(budgetStatus(40000, 50000).status).toBe('warning');
    expect(budgetStatus(39999, 50000).status).toBe('ok');
  });

  it('50000 → warning', () => {
    expect(budgetStatus(50000, 50000).status).toBe('warning');
  });

  it('53000 → over, excesso 3000', () => {
    const p = budgetStatus(53000, 50000);
    expect(p.status).toBe('over');
    expect(p.excessCents).toBe(3000);
    expect(p.remainingCents).toBe(0);
  });

  it('gasto zero → 0%', () => {
    expect(budgetPercent(budgetStatus(0, 50000))).toBe(0);
  });
});

describe('TU-09 — detectThresholdCrossing só dispara ao mudar de faixa', () => {
  const ok = budgetStatus(10, 100);
  const warning = budgetStatus(85, 100);
  const warning2 = budgetStatus(95, 100);
  const over = budgetStatus(130, 100);
  const over2 = budgetStatus(150, 100);

  it.each([
    ['ok→warning', ok, warning, 'warning'],
    ['warning→over', warning, over, 'over'],
    ['ok→over', ok, over, 'over'],
    ['warning→warning', warning, warning2, null],
    ['over→over', over, over2, null],
    ['ok→ok', ok, ok, null],
    ['over→warning', over, warning, null],
    ['warning→ok', warning, ok, null],
  ] as const)('%s', (_label, before, after, expected) => {
    expect(detectThresholdCrossing(before, after)).toBe(expected);
  });
});

describe('TU-10 — resolveBudgets respeita a vigência', () => {
  const rec = (
    from: string,
    limitCents: number | null,
    categoryId = 'mercado' as const,
  ): BudgetRecord => ({
    id: budgetRecordId('w1', categoryId, from),
    walletId: 'w1',
    categoryId,
    effectiveFrom: from,
    limitCents,
  });
  const records = [rec('2026-10', 50000), rec('2026-12', null), rec('2027-02', 70000)];

  it('registro em 2026-10 vale para 10 e 11', () => {
    expect(resolveBudgets(records, '2026-10').get('mercado')).toBe(50000);
    expect(resolveBudgets(records, '2026-11').get('mercado')).toBe(50000);
  });

  it('null em 2026-12 remove a partir de 12', () => {
    expect(resolveBudgets(records, '2026-12').has('mercado')).toBe(false);
    expect(resolveBudgets(records, '2027-01').has('mercado')).toBe(false);
  });

  it('nova vigência posterior volta a valer', () => {
    expect(resolveBudgets(records, '2027-03').get('mercado')).toBe(70000);
  });

  it('setembro sem limite', () => {
    expect(resolveBudgets(records, '2026-09').size).toBe(0);
  });

  it('id idempotente', () => {
    expect(budgetRecordId('w1', 'mercado', '2026-10')).toBe('w1:mercado:2026-10');
  });
});

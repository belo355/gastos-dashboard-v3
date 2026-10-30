import { describe, expect, it } from 'vitest';
import { validateExpenseInput } from './expenseSchema';

const base = {
  walletId: 'w1',
  date: '2026-10-29',
  categoryId: 'mercado',
  amountCents: 5000,
  description: null,
};

describe('TU-03 — Schema de ExpenseInput valida campos', () => {
  it('aceita a entrada válida e normaliza a descrição', () => {
    const r = validateExpenseInput({ ...base, description: '  Almoço  ' });
    expect(r).toEqual({ ok: true, value: { ...base, description: 'Almoço' } });
    const empty = validateExpenseInput({ ...base, description: '   ' });
    expect(empty.ok && empty.value.description).toBeNull();
    const missing = validateExpenseInput({ ...base, description: undefined });
    expect(missing.ok && missing.value.description).toBeNull();
  });

  it('valor ausente ou zero → "Informe o valor"', () => {
    for (const amountCents of [undefined, null, 0, -5, Number.NaN]) {
      const r = validateExpenseInput({ ...base, amountCents });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.amountCents).toBe('Informe o valor');
    }
  });

  it('valor acima do máximo', () => {
    const r = validateExpenseInput({ ...base, amountCents: 100_000_000 });
    expect(!r.ok && r.errors.amountCents).toMatch(/máximo/);
  });

  it('data 2026-02-30 → "Data inválida"', () => {
    const r = validateExpenseInput({ ...base, date: '2026-02-30' });
    expect(!r.ok && r.errors.date).toBe('Data inválida');
    const r2 = validateExpenseInput({ ...base, date: undefined });
    expect(!r2.ok && r2.errors.date).toBe('Data inválida');
  });

  it('categoria ausente → "Escolha uma categoria"', () => {
    const r = validateExpenseInput({ ...base, categoryId: undefined });
    expect(!r.ok && r.errors.categoryId).toBe('Escolha uma categoria');
    const r2 = validateExpenseInput({ ...base, categoryId: 'pets' });
    expect(!r2.ok && r2.errors.categoryId).toBe('Escolha uma categoria');
  });

  it('descrição com 81 caracteres é rejeitada; 80 é aceita', () => {
    expect(validateExpenseInput({ ...base, description: 'a'.repeat(80) }).ok).toBe(true);
    const r = validateExpenseInput({ ...base, description: 'a'.repeat(81) });
    expect(!r.ok && r.errors.description).toBe('Use até 80 caracteres');
  });

  it('reporta vários campos de uma vez', () => {
    const r = validateExpenseInput({ walletId: 'w1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amountCents', 'categoryId', 'date']);
  });
});

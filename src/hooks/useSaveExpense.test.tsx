import { beforeEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import { budgetRepository } from '../data/budgetRepository';
import { expenseRepository } from '../data/expenseRepository';
import { ToastProvider } from '../features/app/Toaster';
import { resetDb } from '../test/factories';
import { computeBudgets } from './useBudgets';
import { useSaveExpense, type SaveResult } from './useSaveExpense';

beforeEach(resetDb);

let save: ReturnType<typeof useSaveExpense>;
function Harness({ onReady }: { onReady: (fn: ReturnType<typeof useSaveExpense>) => void }) {
  const fn = useSaveExpense();
  useEffect(() => onReady(fn), [fn, onReady]);
  return null;
}
const capture = (fn: ReturnType<typeof useSaveExpense>) => {
  save = fn;
};

const input = (amountCents: number) => ({
  walletId: 'w1',
  date: '2026-10-15',
  categoryId: 'mercado' as const,
  amountCents,
  description: null,
});

describe('TI-10 — useSaveExpense emite aviso ao cruzar faixa', () => {
  it('ok → alerta (86%) → estourado (R$ 30,00 acima do limite), em região aria-live', async () => {
    render(
      <ToastProvider>
        <Harness onReady={capture} />
      </ToastProvider>,
    );
    await budgetRepository.setLimit('w1', 'mercado', '2026-10', 50000);
    await expenseRepository.create(input(38000));

    let r: SaveResult | undefined;
    await act(async () => {
      r = await save(input(5000));
    });
    expect(r?.ok).toBe(true);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent('Mercado em alerta: 86% do limite');

    await act(async () => {
      await save(input(10000));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('R$ 30,00 acima do limite');
    expect(screen.getByRole('alert')).toHaveTextContent('Mercado estourou o limite');
  });

  it('sem mudança de faixa ou sem limite, não há aviso de orçamento', async () => {
    render(
      <ToastProvider>
        <Harness onReady={capture} />
      </ToastProvider>,
    );
    await act(async () => {
      await save(input(1000));
    });
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toHaveTextContent('Gasto salvo: R$ 10,00 em Mercado');

    await budgetRepository.setLimit('w1', 'mercado', '2026-10', 50000);
    await act(async () => {
      await save(input(1000));
    });
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });
});

describe('computeBudgets', () => {
  it('totais do mês só consideram categorias orçadas', () => {
    const records = [
      {
        id: 'a',
        walletId: 'w1',
        categoryId: 'mercado' as const,
        effectiveFrom: '2026-10',
        limitCents: 50000,
      },
      {
        id: 'b',
        walletId: 'w1',
        categoryId: 'lazer' as const,
        effectiveFrom: '2026-10',
        limitCents: 10000,
      },
    ];
    const data = computeBudgets(
      records,
      [
        { categoryId: 'mercado', amountCents: 32000 },
        { categoryId: 'lazer', amountCents: 15000 },
        { categoryId: 'carro', amountCents: 99999 },
      ],
      '2026-10',
    );
    expect(data.rows.map((r) => [r.categoryId, r.progress.status])).toEqual([
      ['mercado', 'ok'],
      ['lazer', 'over'],
    ]);
    expect(data.totals).toEqual({
      budgetedCents: 60000,
      spentCents: 47000,
      remainingCents: 13000,
      excessCents: 0,
    });
  });
});

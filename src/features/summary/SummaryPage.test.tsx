import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { db } from '../../data/db';
import { expenseRepository } from '../../data/expenseRepository';
import { settingsRepository } from '../../data/settingsRepository';
import { addMonths, currentMonth, today } from '../../domain/dates';
import { readyApp } from '../../test/factories';

beforeEach(readyApp);

async function seedCurrentMonth() {
  const s = await settingsRepository.ensureInitialized();
  const w = s.activeWalletId;
  const d = today();
  await expenseRepository.create({
    walletId: w,
    date: d,
    categoryId: 'mercado',
    amountCents: 30000,
    description: 'Feira',
  });
  await expenseRepository.create({
    walletId: w,
    date: d,
    categoryId: 'transporte',
    amountCents: 10000,
    description: 'Ônibus',
  });
  await expenseRepository.create({
    walletId: w,
    date: d,
    categoryId: 'lazer',
    amountCents: 10000,
    description: 'Cinema',
  });
  return w;
}

function rankingRows() {
  return within(screen.getByRole('list', { name: /Gastos por categoria/ })).getAllByTestId(
    'ranking-row',
  );
}

describe('TI-09 — SummaryPage atualiza após salvar', () => {
  it('total, percentuais e ranking mudam após salvar; tocar na categoria filtra a lista', async () => {
    const user = userEvent.setup();
    await seedCurrentMonth();
    render(<App initialPath="/" />);

    await waitFor(() => expect(rankingRows()).toHaveLength(3));
    expect(rankingRows().map((r) => r.dataset.category)).toEqual([
      'mercado',
      'lazer',
      'transporte',
    ]);
    expect(rankingRows().map((r) => within(r).getByTestId('ranking-percent').textContent)).toEqual([
      '60%',
      '20%',
      '20%',
    ]);
    expect(screen.getByText('R$ 500,00', { selector: '.sr-only' })).toBeInTheDocument();

    await user.click(screen.getByTestId('launch-button'));
    const dialog = within(await screen.findByRole('dialog', { name: 'Lançar gasto' }));
    await user.type(dialog.getByLabelText('Valor'), '400');
    await user.click(dialog.getByRole('radio', { name: /Lazer/ }));
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(rankingRows().map((r) => r.dataset.category)).toEqual([
        'lazer',
        'mercado',
        'transporte',
      ]),
    );
    expect(rankingRows().map((r) => within(r).getByTestId('ranking-percent').textContent)).toEqual([
      '55,6%',
      '33,3%',
      '11,1%',
    ]);
    expect(screen.getByText('R$ 900,00', { selector: '.sr-only' })).toBeInTheDocument();

    await user.click(rankingRows()[1]!);
    const list = await screen.findByRole('list', { name: 'Lançamentos do mês' });
    const rows = within(list).getAllByTestId('expense-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAccessibleName(/Feira.*Mercado/);
    expect(screen.getByRole('button', { name: /Mercado/, pressed: true })).toBeInTheDocument();
  });

  it('mês sem lançamentos mostra estado vazio com ação', async () => {
    render(<App initialPath="/" />);
    expect(await screen.findByText(/Nenhum gasto em .* ainda\./)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Lançar' }).length).toBeGreaterThanOrEqual(2);
  });

  it('mostra a comparação com o mês anterior', async () => {
    const user = userEvent.setup();
    const w = await seedCurrentMonth();
    const prev = addMonths(currentMonth(), -1);
    await db.expenses.add({
      id: 'p1',
      walletId: w,
      date: `${prev}-10`,
      month: prev,
      categoryId: 'mercado',
      amountCents: 100000,
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    render(<App initialPath="/" />);
    const comparison = await screen.findByTestId('month-comparison');
    expect(comparison).toHaveTextContent(/Gastou menos que em/);
    expect(comparison).toHaveTextContent('−R$ 500,00 (−50%)');

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(await screen.findByTestId('month-comparison')).toHaveTextContent(
      'Primeiro mês com gastos',
    );
  });
});

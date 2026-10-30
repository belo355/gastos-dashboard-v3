import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { expenseRepository } from '../../data/expenseRepository';
import { settingsRepository } from '../../data/settingsRepository';
import { today } from '../../domain/dates';
import { readyApp } from '../../test/factories';

beforeEach(readyApp);

describe('BudgetPage', () => {
  it('define limite, mostra 64% / "R$ 320,00 de R$ 500,00" / "Restam R$ 180,00", altera e remove', async () => {
    const user = userEvent.setup();
    const s = await settingsRepository.ensureInitialized();
    await expenseRepository.create({
      walletId: s.activeWalletId,
      date: today(),
      categoryId: 'mercado',
      amountCents: 32000,
      description: null,
    });
    render(<App initialPath="/orcamento" />);

    await user.click(await screen.findByRole('button', { name: /^Mercado.*Definir limite$/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Limite de Mercado' }));
    await user.type(dialog.getByLabelText('Limite mensal'), '500');
    await user.click(dialog.getByRole('button', { name: 'Salvar limite' }));

    const row = await screen.findByTestId('budget-row');
    expect(within(row).getByTestId('budget-percent')).toHaveTextContent('64%');
    expect(within(row).getByTestId('budget-spent')).toHaveTextContent('R$ 320,00 de R$ 500,00');
    expect(within(row).getByTestId('budget-remaining')).toHaveTextContent('Restam R$ 180,00');
    expect(within(row).getByTestId('budget-state')).toHaveTextContent('Dentro do limite');
    expect(within(row).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '64');

    await user.click(within(row).getByRole('button', { name: 'Alterar limite de Mercado' }));
    const edit = within(await screen.findByRole('dialog', { name: 'Limite de Mercado' }));
    expect(edit.getByLabelText('Limite mensal')).toHaveValue('500,00');
    await user.clear(edit.getByLabelText('Limite mensal'));
    await user.type(edit.getByLabelText('Limite mensal'), '350');
    await user.click(edit.getByRole('button', { name: 'Salvar limite' }));
    expect(await screen.findByText('Faltam R$ 30,00 para o limite')).toBeInTheDocument();
    expect(screen.getByTestId('budget-state')).toHaveTextContent('Em alerta');

    await user.click(screen.getByRole('button', { name: 'Alterar limite de Mercado' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Limite de Mercado' })).getByRole('button', {
        name: 'Remover limite',
      }),
    );
    expect(
      await screen.findByRole('button', { name: /^Mercado.*Definir limite$/ }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('budget-row')).not.toBeInTheDocument();
  });

  it('limite inválido mostra erro', async () => {
    const user = userEvent.setup();
    render(<App initialPath="/orcamento" />);
    await user.click(await screen.findByRole('button', { name: /^Lazer.*Definir limite$/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Limite de Lazer' }));
    await user.click(dialog.getByRole('button', { name: 'Salvar limite' }));
    expect(await dialog.findByText('Informe o valor do limite')).toBeInTheDocument();
  });
});

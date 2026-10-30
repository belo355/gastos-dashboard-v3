import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { expenseRepository } from '../../data/expenseRepository';
import { db } from '../../data/db';
import { AppError } from '../../lib/errors';
import { readyApp } from '../../test/factories';

beforeEach(readyApp);
afterEach(() => vi.restoreAllMocks());

async function openForm() {
  const user = userEvent.setup();
  render(<App initialPath="/lancamentos" />);
  await user.click(await screen.findByRole('button', { name: 'Lançar' }));
  const dialog = await screen.findByRole('dialog', { name: 'Lançar gasto' });
  return { user, dialog: within(dialog) };
}

describe('formulário de lançamento', () => {
  it('abre com foco no valor e teclado decimal; salva e aparece na lista', async () => {
    const { user, dialog } = await openForm();
    const valor = dialog.getByLabelText('Valor');
    expect(valor).toHaveFocus();
    expect(valor).toHaveAttribute('inputmode', 'decimal');

    await user.type(valor, '25,90');
    await user.click(dialog.getByRole('radio', { name: /Alimentação/ }));
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const list = await screen.findByRole('list', { name: 'Lançamentos do mês' });
    expect(within(list).getByText('R$ 25,90')).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Gasto salvo: R$ 25,90 em Alimentação',
    );
  });

  it('valor vazio mostra "Informe o valor" e mantém categoria e descrição', async () => {
    const { user, dialog } = await openForm();
    await user.click(dialog.getByRole('radio', { name: /Mercado/ }));
    await user.type(dialog.getByLabelText(/Descrição/), 'Feira');
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));

    expect(await dialog.findByText('Informe o valor')).toBeInTheDocument();
    expect(dialog.getByRole('radio', { name: /Mercado/ })).toHaveAttribute('aria-checked', 'true');
    expect(dialog.getByLabelText(/Descrição/)).toHaveValue('Feira');
    expect(dialog.getByLabelText('Valor')).toHaveFocus();
    expect(await db.expenses.count()).toBe(0);
  });

  it('sem categoria mostra "Escolha uma categoria"', async () => {
    const { user, dialog } = await openForm();
    await user.type(dialog.getByLabelText('Valor'), '10');
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));
    expect(await dialog.findByText('Escolha uma categoria')).toBeInTheDocument();
  });

  it('setas do teclado escolhem a categoria', async () => {
    const { user, dialog } = await openForm();
    dialog.getByRole('radio', { name: /Alimentação/ }).focus();
    await user.keyboard('{ArrowRight}');
    expect(dialog.getByRole('radio', { name: /Mercado/ })).toHaveAttribute('aria-checked', 'true');
    expect(dialog.getByRole('radio', { name: /Mercado/ })).toHaveFocus();
  });

  it('Esc fecha o formulário', async () => {
    const { user } = await openForm();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('TI-08 — ExpenseFormSheet preserva os dados quando a gravação falha', () => {
  it('com storage_unavailable mostra a mensagem e os campos permanecem preenchidos', async () => {
    vi.spyOn(expenseRepository, 'create').mockRejectedValue(new AppError('storage_unavailable'));
    const { user, dialog } = await openForm();
    await user.type(dialog.getByLabelText('Valor'), '25,90');
    await user.click(dialog.getByRole('radio', { name: /Alimentação/ }));
    await user.type(dialog.getByLabelText(/Descrição/), 'Almoço');
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));

    expect(
      await dialog.findByText('Não foi possível salvar no aparelho. Tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Lançar gasto' })).toBeInTheDocument();
    expect(dialog.getByLabelText('Valor')).toHaveValue('25,90');
    expect(dialog.getByRole('radio', { name: /Alimentação/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(dialog.getByLabelText(/Descrição/)).toHaveValue('Almoço');
  });
});

describe('editar e excluir', () => {
  it('edita o valor e exclui com confirmação', async () => {
    const { user, dialog } = await openForm();
    await user.type(dialog.getByLabelText('Valor'), '10');
    await user.click(dialog.getByRole('radio', { name: /Lazer/ }));
    await user.click(dialog.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(await screen.findByTestId('expense-row'));
    const edit = within(await screen.findByRole('dialog', { name: 'Editar gasto' }));
    const valor = edit.getByLabelText('Valor');
    expect(valor).toHaveValue('10,00');
    await user.clear(valor);
    await user.type(valor, '12,50');
    await user.click(edit.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(screen.getByTestId('expense-row')).toHaveAccessibleName(/R\$ 12,50/),
    );

    await user.click(screen.getByTestId('expense-row'));
    const edit2 = within(await screen.findByRole('dialog', { name: 'Editar gasto' }));
    await user.click(edit2.getByRole('button', { name: 'Excluir' }));
    const confirm = within(await screen.findByRole('alertdialog', { name: 'Excluir este gasto?' }));
    expect(confirm.getByText('Essa ação não pode ser desfeita.')).toBeInTheDocument();
    await user.click(confirm.getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText(/Nenhum gasto em/)).toBeInTheDocument();
    expect(await db.expenses.count()).toBe(0);
  });
});

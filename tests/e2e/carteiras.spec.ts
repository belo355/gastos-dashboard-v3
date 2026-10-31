import { expect, test } from '@playwright/test';
import { goTab, openApp, seed, skipOnboarding, todayInSaoPaulo } from './helpers';

test('E2E-07 — Carteiras: alternar e nome duplicado', async ({ page }) => {
  await openApp(page);
  await skipOnboarding(page);
  const { iso, month } = todayInSaoPaulo();
  await seed(page, {
    wallets: [{ id: 'viagem', name: 'Viagem' }],
    expenses: [
      { date: iso, categoryId: 'mercado', amountCents: 32000, description: 'Feira' },
      {
        date: iso,
        categoryId: 'transporte',
        amountCents: 9000,
        walletId: 'viagem',
        description: 'Táxi do aeroporto',
      },
    ],
    budgets: [
      { categoryId: 'mercado', effectiveFrom: month, limitCents: 50000 },
      { categoryId: 'lazer', effectiveFrom: month, limitCents: 30000, walletId: 'viagem' },
    ],
  });

  // Pessoal (ativa)
  await expect(page.getByTestId('wallet-chip').filter({ hasText: 'Pessoal' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('month-total')).toHaveText('R$ 320,00');

  // Um toque troca para Viagem
  await page.getByTestId('wallet-chip').filter({ hasText: 'Viagem' }).click();
  await expect(page.getByTestId('wallet-chip').filter({ hasText: 'Viagem' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('month-total')).toHaveText('R$ 90,00');
  await expect(page.getByTestId('ranking-row')).toHaveCount(1);
  await expect(page.getByTestId('ranking-row')).toContainText('Transporte');

  await goTab(page, 'Lançamentos');
  await expect(page.getByTestId('expense-row')).toHaveCount(1);
  await expect(page.getByTestId('expense-row')).toContainText('Táxi do aeroporto');

  await goTab(page, 'Orçamento');
  await expect(page.getByTestId('budget-row')).toHaveCount(1);
  await expect(page.getByTestId('budget-row')).toHaveAttribute('data-category', 'lazer');

  // Lançar em Viagem não afeta Pessoal
  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill('10');
  await dialog.getByRole('radio', { name: 'Lazer' }).click();
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await page.getByTestId('wallet-chip').filter({ hasText: 'Pessoal' }).click();
  await goTab(page, 'Resumo');
  await expect(page.getByTestId('month-total')).toHaveText('R$ 320,00');

  // Nome duplicado
  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Carteiras/ }).click();
  await page.getByLabel('Nova carteira').fill('Casa');
  await page.getByRole('button', { name: 'Criar' }).click();
  await expect(page.getByTestId('wallet-item')).toHaveCount(3);
  await page.getByLabel('Nova carteira').fill('casa');
  await page.getByRole('button', { name: 'Criar' }).click();
  await expect(page.getByText('Já existe uma carteira com esse nome')).toBeVisible();
  await expect(page.getByTestId('wallet-item')).toHaveCount(3);

  // Renomear e excluir (cascata)
  await page.getByRole('button', { name: 'Renomear Casa' }).click();
  const rename = page.getByRole('dialog', { name: 'Renomear carteira' });
  await rename.getByLabel('Nome').fill('Viagem');
  await rename.getByRole('button', { name: 'Salvar' }).click();
  await expect(rename.getByText('Já existe uma carteira com esse nome')).toBeVisible();
  await rename.getByLabel('Nome').fill('Lar');
  await rename.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByTestId('wallet-item').filter({ hasText: 'Lar' })).toBeVisible();

  await page.getByRole('button', { name: 'Excluir Viagem' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Excluir a carteira "Viagem"?' });
  await expect(confirm).toContainText('lançamentos e orçamentos dela serão apagados');
  await confirm.getByRole('button', { name: 'Excluir carteira' }).click();
  await expect(page.getByTestId('wallet-item')).toHaveCount(2);
});

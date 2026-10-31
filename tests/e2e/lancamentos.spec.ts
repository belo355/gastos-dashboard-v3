import { expect, test } from '@playwright/test';
import { goTab, openApp, seed, skipOnboarding, todayInSaoPaulo } from './helpers';

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await skipOnboarding(page);
  await page.reload();
});

test('E2E-01 — Lançamento rápido pelo botão "Lançar"', async ({ page }) => {
  for (const tab of ['Resumo', 'Lançamentos', 'Orçamento', 'Mais'] as const) {
    await goTab(page, tab);
    await page.getByTestId('launch-button').click();
    const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
    await expect(dialog).toBeVisible();
    const valor = dialog.getByLabel('Valor');
    await expect(valor).toBeFocused();
    await expect(valor).toHaveAttribute('inputmode', 'decimal');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }

  await goTab(page, 'Orçamento');
  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill('25,90');
  await dialog.getByRole('radio', { name: 'Alimentação' }).click();
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialog).toBeHidden();

  await goTab(page, 'Lançamentos');
  const row = page.getByTestId('expense-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Alimentação');
  await expect(row).toContainText('R$ 25,90');
  await expect(row).toContainText(todayInSaoPaulo().br);
});

test('E2E-02 — Validação sem perda de dados', async ({ page }) => {
  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByRole('radio', { name: 'Mercado' }).click();
  await dialog.getByLabel(/Descrição/).fill('Feira da semana');
  await dialog.getByRole('button', { name: 'Salvar' }).click();

  await expect(dialog.getByText('Informe o valor')).toBeVisible();
  await expect(dialog.getByRole('radio', { name: 'Mercado' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(dialog.getByLabel(/Descrição/)).toHaveValue('Feira da semana');

  await dialog.getByLabel('Valor').fill('0');
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialog.getByText('Informe o valor')).toBeVisible();
  await expect(dialog.getByLabel(/Descrição/)).toHaveValue('Feira da semana');
});

test('E2E-05 — Editar e excluir lançamento', async ({ page }) => {
  const { iso } = todayInSaoPaulo();
  await seed(page, {
    expenses: [{ date: iso, categoryId: 'lazer', amountCents: 4000, description: 'Cinema' }],
  });
  await goTab(page, 'Lançamentos');

  const row = page.getByTestId('expense-row');
  await expect(row).toContainText('R$ 40,00');
  await row.click();
  const edit = page.getByRole('dialog', { name: 'Editar gasto' });
  await expect(edit.getByLabel('Valor')).toHaveValue('40,00');
  await edit.getByLabel('Valor').fill('55,00');
  await edit.getByRole('button', { name: 'Salvar' }).click();
  await expect(edit).toBeHidden();
  await expect(row).toContainText('R$ 55,00');

  await goTab(page, 'Resumo');
  await expect(page.getByTestId('month-total')).toHaveText('R$ 55,00');
  await goTab(page, 'Lançamentos');

  await row.click();
  await page
    .getByRole('dialog', { name: 'Editar gasto' })
    .getByRole('button', { name: 'Excluir' })
    .click();
  const confirm = page.getByRole('alertdialog', { name: 'Excluir este gasto?' });
  await expect(confirm).toContainText('não pode ser desfeita');
  await confirm.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByTestId('expense-row')).toHaveCount(0);
  await expect(page.getByText(/Nenhum gasto em .* ainda/)).toBeVisible();

  await goTab(page, 'Resumo');
  await expect(page.getByTestId('month-total')).toHaveText('R$ 0,00');
});

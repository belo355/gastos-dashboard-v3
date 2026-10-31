import { expect, test, type Page } from '@playwright/test';
import { goTab, openApp, seed, skipOnboarding, todayInSaoPaulo } from './helpers';

async function launch(page: Page, value: string, category: string) {
  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill(value);
  await dialog.getByRole('radio', { name: category }).click();
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(dialog).toBeHidden();
}

test('E2E-06 — Ciclo de orçamento: ok → alerta → estourado', async ({ page }) => {
  await openApp(page);
  await skipOnboarding(page);
  await seed(page, {
    expenses: [{ date: todayInSaoPaulo().iso, categoryId: 'mercado', amountCents: 32000 }],
  });

  await goTab(page, 'Orçamento');
  await page.getByRole('button', { name: /^Mercado.*Definir limite$/ }).click();
  const editor = page.getByRole('dialog', { name: 'Limite de Mercado' });
  await editor.getByLabel('Limite mensal').fill('500,00');
  await editor.getByRole('button', { name: 'Salvar limite' }).click();

  const row = page.locator('[data-testid="budget-row"][data-category="mercado"]');
  await expect(row.getByTestId('budget-percent')).toHaveText('64%');
  await expect(row.getByTestId('budget-spent')).toHaveText('R$ 320,00 de R$ 500,00');
  await expect(row.getByTestId('budget-remaining')).toHaveText('Restam R$ 180,00');
  await expect(row.getByTestId('budget-state')).toHaveText('Dentro do limite');

  await launch(page, '60', 'Mercado');
  await expect(row.getByTestId('budget-percent')).toHaveText('76%');
  await expect(row.getByTestId('budget-state')).toHaveText('Dentro do limite');

  await launch(page, '50', 'Mercado');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Mercado em alerta: 86% do limite' }),
  ).toBeVisible();
  await expect(row.getByTestId('budget-state')).toHaveText('Em alerta');
  await expect(row.getByTestId('budget-percent')).toHaveText('86%');

  await launch(page, '100', 'Mercado');
  await expect(
    page.getByRole('alert').filter({ hasText: 'R$ 30,00 acima do limite' }),
  ).toBeVisible();
  await expect(row.getByTestId('budget-state')).toHaveText('Estourado');
  await expect(row.getByTestId('budget-remaining')).toHaveText('R$ 30,00 acima do limite');

  // No resumo, o mesmo estado aparece com texto.
  await goTab(page, 'Resumo');
  const sumRow = page.locator('[data-testid="budget-row"][data-category="mercado"]');
  await expect(sumRow.getByTestId('budget-state')).toHaveText('Estourado');
  await expect(page.getByTestId('budget-balance')).toHaveText('R$ 30,00');

  // No mês seguinte o limite continua aplicado.
  await goTab(page, 'Orçamento');
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await expect(row.getByTestId('budget-spent')).toHaveText('R$ 0,00 de R$ 500,00');
  await expect(row.getByTestId('budget-percent')).toHaveText('0%');
  await expect(row.getByTestId('budget-state')).toHaveText('Dentro do limite');
});

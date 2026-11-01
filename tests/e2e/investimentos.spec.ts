import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { goTab, openApp } from './helpers';

async function audit(page: Page, label: string) {
  await page.waitForTimeout(900);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${label}: ${v.id} — ${v.help} (${v.nodes[0]?.target.join(' ')})`),
  ).toEqual([]);
}

test('Investimentos — cadastrar existente, aportar, informar saldo e ver aplicado × ganho', async ({
  page,
}) => {
  const csp: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text());
  });
  await openApp(page);
  await goTab(page, 'Investimentos');
  await expect(page.getByText('Acompanhe seus investimentos')).toBeVisible();

  // "Lançar" sem investimentos abre o cadastro.
  await page.getByTestId('launch-button').click();
  const form = page.getByRole('dialog', { name: 'Novo investimento' });
  await form.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(form.getByText('Informe o nome do investimento')).toBeVisible();
  await expect(form.getByText('Escolha o tipo')).toBeVisible();
  await expect(form.getByText('Informe o valor aplicado')).toBeVisible();

  await form.getByLabel('Nome').fill('CDB Teste');
  await form.getByRole('radio', { name: 'Renda fixa' }).click();
  await form.getByLabel('Valor aplicado').fill('1.000,00');
  await form.getByLabel(/Saldo atual/).fill('1.100,00');
  await form.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(form).toBeHidden();

  await expect(page.getByTestId('kpi-patrimonio')).toContainText('R$ 1.100,00');
  await expect(page.getByTestId('kpi-aplicado')).toContainText('R$ 1.000,00');
  await expect(page.getByTestId('kpi-ganho')).toContainText('+R$ 100,00');
  await expect(page.getByTestId('chart-detail')).toContainText('R$ 1.100,00');

  // Aporte pelo botão "Lançar" da barra.
  await page.getByTestId('launch-button').click();
  const entry = page.getByRole('dialog', { name: 'Lançar investimento' });
  await expect(entry.getByRole('radio', { name: 'Aporte' })).toBeChecked();
  await entry.getByLabel('Valor').fill('500');
  await entry.getByRole('button', { name: 'Salvar' }).click();
  await expect(entry).toBeHidden();
  await expect(page.getByTestId('kpi-patrimonio')).toContainText('R$ 1.600,00');
  await expect(page.getByTestId('kpi-aplicado')).toContainText('R$ 1.500,00');
  await expect(page.getByTestId('statement-row')).toHaveCount(3);

  // Detalhe do ativo: informar saldo muda o ganho, e o aplicado continua.
  await page.getByTestId('asset-row').filter({ hasText: 'CDB Teste' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'CDB Teste' })).toBeVisible();
  await page.getByRole('button', { name: 'Informar saldo' }).click();
  const saldo = page.getByRole('dialog', { name: 'Lançar investimento' });
  await expect(saldo.getByRole('radio', { name: 'Saldo' })).toBeChecked();
  await saldo.getByLabel('Valor').fill('1.400,00');
  await saldo.getByRole('button', { name: 'Salvar' }).click();
  await expect(saldo).toBeHidden();
  const summary = page.getByTestId('asset-summary');
  await expect(summary).toContainText('R$ 1.400,00');
  await expect(summary).toContainText('R$ 1.500,00');
  await expect(summary).toContainText('−R$ 100,00');

  // Editar uma movimentação pelo extrato e excluí-la.
  await page.getByTestId('statement-row').first().click();
  const edit = page.getByRole('dialog', { name: 'Editar movimentação' });
  await edit.getByRole('button', { name: 'Excluir' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(edit).toBeHidden();
  await expect(summary).toContainText('R$ 1.600,00');

  // Os dados sobrevivem a recarregar.
  await page.reload();
  await expect(page.getByTestId('asset-summary')).toContainText('R$ 1.600,00');
  expect(csp).toEqual([]);
});

test('Investimentos — exemplo com histórico, gráfico navegável e sem violações de acessibilidade', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openApp(page);
  await goTab(page, 'Investimentos');
  await page.getByRole('button', { name: 'Ver um exemplo com dados fictícios' }).click();
  await expect(page.getByTestId('inv-sample-banner')).toBeVisible();
  await expect(page.getByTestId('asset-group')).toHaveCount(5);

  // Gráfico: 12 meses por padrão; setas trocam o mês mostrado.
  const months = page
    .getByRole('radiogroup', { name: 'Escolher mês do gráfico' })
    .getByRole('radio');
  await expect(months).toHaveCount(12);
  await expect(months.last()).toBeChecked();
  await months.last().focus();
  await page.keyboard.press('ArrowLeft');
  await expect(months.nth(10)).toBeChecked();
  await page.getByRole('radio', { name: 'Tudo' }).click();
  await expect(months).toHaveCount(14);

  await audit(page, 'Investimentos');
  await page.getByTestId('asset-row').first().click();
  await expect(page.getByTestId('asset-summary')).toBeVisible();
  await audit(page, 'Detalhe do investimento');

  await page.getByRole('link', { name: 'Investimentos' }).first().click();
  await page.getByRole('button', { name: 'Apagar exemplo' }).click();
  await expect(page.getByText('Acompanhe seus investimentos')).toBeVisible();
});

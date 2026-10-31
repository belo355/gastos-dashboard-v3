import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { readSheet } from 'read-excel-file/node';
import { addMonths, goTab, openApp, seed, skipOnboarding, todayInSaoPaulo } from './helpers';

const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));
const LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const label = (m: string) => `${LABELS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

async function goToMonth(page: Page, target: string) {
  for (let i = 0; i < 48; i++) {
    const text = await page.getByTestId('month-label').textContent();
    if (text === label(target)) return;
    const [ty, tm] = target.split('-').map(Number) as [number, number];
    const idx = LABELS.findIndex((l) => text?.startsWith(l));
    const cy = Number(text?.slice(-4));
    const forward = ty * 12 + tm > cy * 12 + idx + 1;
    await page.getByRole('button', { name: forward ? 'Próximo mês' : 'Mês anterior' }).click();
  }
  throw new Error(`não chegou em ${target}`);
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await skipOnboarding(page);
});

test('E2E-08 — Exportar meses', async ({ page }) => {
  const { iso, month } = todayInSaoPaulo();
  const prev = addMonths(month, -1);
  await seed(page, {
    expenses: [
      { date: iso, categoryId: 'mercado', amountCents: 18437, description: 'Compras' },
      { date: `${month}-01`, categoryId: 'alimentacao', amountCents: 2590, description: 'Almoço' },
      { date: `${prev}-10`, categoryId: 'lazer', amountCents: 6000, description: null },
    ],
  });
  const totalNow = await page.getByTestId('month-total').textContent();

  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Exportar planilha/ }).click();
  const button = page.getByRole('button', { name: 'Baixar 2 arquivos' });
  await expect(button).toBeEnabled();

  const downloads: { name: string; path: string }[] = [];
  page.on('download', async (d) => {
    downloads.push({ name: d.suggestedFilename(), path: (await d.path())! });
  });
  await button.click();
  await expect.poll(() => downloads.length, { timeout: 15_000 }).toBe(2);
  await expect
    .poll(async () => (await Promise.all(downloads.map((d) => d.path))).every(Boolean))
    .toBe(true);

  expect(downloads.map((d) => d.name).sort()).toEqual(
    [`gastos-pessoal-${prev}.xlsx`, `gastos-pessoal-${month}.xlsx`].sort(),
  );

  const sumOf = async (name: string) => {
    const d = downloads.find((x) => x.name === name)!;
    const rows = await readSheet(await readFile(d.path));
    expect(rows[0]).toEqual(['Data', 'Descrição', 'Categoria', 'Valor']);
    return {
      rows: rows.slice(1),
      cents: Math.round(rows.slice(1).reduce((a, r) => a + Number(r[3]), 0) * 100),
    };
  };
  const now = await sumOf(`gastos-pessoal-${month}.xlsx`);
  const before = await sumOf(`gastos-pessoal-${prev}.xlsx`);
  expect(now.rows).toHaveLength(2);
  expect(now.cents).toBe(21027);
  expect(totalNow).toBe('R$ 210,27');
  expect(before.cents).toBe(6000);
  // Linhas em ordem crescente de data, com categoria pelo nome.
  expect(now.rows.map((r) => r[2])).toEqual(['Alimentação', 'Mercado']);
  expect(now.rows[0]![0]).toBeInstanceOf(Date);
});

test('E2E-09 — Importar com prévia e conflito', async ({ page }) => {
  await seed(page, {
    expenses: [
      { date: '2026-10-20', categoryId: 'carro', amountCents: 77700, description: 'Revisão' },
    ],
  });

  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Importar planilha/ }).click();

  // Arquivo corrompido → mensagem clara.
  await page
    .getByLabel('Escolher planilhas (.xlsx)')
    .setInputFiles(resolve(FIXTURES, 'corrompido.xlsx'));
  await expect(page.getByTestId('import-error')).toHaveText('Não foi possível ler a planilha.');
  await page
    .getByLabel('Escolher planilhas (.xlsx)')
    .setInputFiles(resolve(FIXTURES, 'sem-colunas.xlsx'));
  await expect(page.getByTestId('import-error')).toContainText('Categoria, Valor');

  // Prévia do CA-15.
  await page
    .getByLabel('Escolher planilhas (.xlsx)')
    .setInputFiles(resolve(FIXTURES, 'ca15-20-linhas.xlsx'));
  await expect(page.getByTestId('preview-valid')).toHaveText('17 lançamentos');
  await expect(page.getByTestId('preview-discarded')).toHaveText('1 linha descartada');
  await expect(page.getByTestId('preview-others')).toHaveText('1 em Outros');
  await expect(page.getByTestId('preview-months')).toHaveText('Outubro 2026');
  await expect(page.getByTestId('import-conflict')).toContainText('Outubro 2026');

  // Cancelar mantém os dados.
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await goTab(page, 'Lançamentos');
  await goToMonth(page, '2026-10');
  await expect(page.getByTestId('expense-row')).toHaveCount(1);
  await expect(page.getByTestId('expense-row')).toContainText('Revisão');

  // Substituir troca o mês.
  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Importar planilha/ }).click();
  await page
    .getByLabel('Escolher planilhas (.xlsx)')
    .setInputFiles(resolve(FIXTURES, 'ca15-20-linhas.xlsx'));
  await page.getByRole('button', { name: 'Substituir' }).click();
  await expect(page.getByTestId('import-done')).toContainText('17 lançamentos em Outubro 2026');

  await goTab(page, 'Lançamentos');
  await goToMonth(page, '2026-10');
  await expect(page.getByTestId('expense-row')).toHaveCount(17);
  await expect(page.getByText('Revisão')).toHaveCount(0);
  await expect(page.getByTestId('expense-row').filter({ hasText: 'Cadernos' })).toContainText(
    'Outros',
  );
});

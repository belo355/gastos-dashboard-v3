import { fileURLToPath } from 'node:url';
import { expect, test, type Page, type Request } from '@playwright/test';
import { goTab, openApp, todayInSaoPaulo } from './helpers';

const FIXTURE = fileURLToPath(new URL('../fixtures/ca15-20-linhas.xlsx', import.meta.url));

/** Toda requisição deve ser um GET same-origin de arquivo estático, sem query nem corpo. */
function watchRequests(page: Page, baseURL: string) {
  const bad: string[] = [];
  page.on('request', (req: Request) => {
    const url = new URL(req.url());
    if (url.protocol === 'blob:' || url.protocol === 'data:') return;
    const sameOrigin = url.origin === new URL(baseURL).origin;
    const staticAsset =
      url.pathname === '/' ||
      /\.(js|css|html|svg|png|ico|webmanifest|woff2?)$/.test(url.pathname) ||
      url.pathname.startsWith('/mais') ||
      url.pathname.startsWith('/lanc') ||
      url.pathname.startsWith('/orc');
    if (
      !sameOrigin ||
      req.method() !== 'GET' ||
      url.search !== '' ||
      req.postData() ||
      !staticAsset
    ) {
      bad.push(`${req.method()} ${req.url()}`);
    }
  });
  return bad;
}

test('E2E-10 — Funcionamento offline e ausência de tráfego de dados', async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const bad = watchRequests(page, baseURL!);

  await openApp(page);
  // Espera o service worker controlar a página (precache completo).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();

  // Lançar
  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill('42,00');
  await dialog.getByRole('radio', { name: 'Mercado' }).click();
  await dialog.getByRole('button', { name: 'Salvar' }).click();

  // Resumo
  await expect(page.getByTestId('month-total')).toHaveText('R$ 42,00');
  await expect(page.getByTestId('ranking-row')).toHaveCount(1);

  // Orçamento
  await goTab(page, 'Orçamento');
  await page.getByRole('button', { name: /^Mercado.*Definir limite$/ }).click();
  const editor = page.getByRole('dialog', { name: 'Limite de Mercado' });
  await editor.getByLabel('Limite mensal').fill('100');
  await editor.getByRole('button', { name: 'Salvar limite' }).click();
  await expect(
    page
      .locator('[data-testid="budget-row"][data-category="mercado"]')
      .getByTestId('budget-percent'),
  ).toHaveText('42%');

  // Exportar (bibliotecas de planilha vêm do precache)
  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Exportar planilha/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar 1 arquivo' }).click();
  expect((await download).suggestedFilename()).toBe(
    `gastos-pessoal-${todayInSaoPaulo().month}.xlsx`,
  );

  // Importar
  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Importar planilha/ }).click();
  await page.getByLabel('Escolher planilhas (.xlsx)').setInputFiles(FIXTURE);
  await expect(page.getByTestId('preview-valid')).toHaveText('17 lançamentos');

  await context.setOffline(false);
  expect(bad, `requisições inesperadas:\n${bad.join('\n')}`).toEqual([]);
});

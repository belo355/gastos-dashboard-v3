import { expect, test } from '@playwright/test';
import { goTab, openApp } from './helpers';

test.use({ colorScheme: 'light' });

/** Cor de fundo calculada da página, para conferir o tema que de fato está na tela. */
function bodyBg(page: import('@playwright/test').Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test('Aparência — escolher Escuro vale na hora e depois de recarregar', async ({ page }) => {
  await openApp(page);
  await goTab(page, 'Mais');
  const group = page.getByRole('radiogroup', { name: 'Aparência' });
  await expect(group.getByRole('radio', { name: 'Automático' })).toBeChecked();
  expect(await bodyBg(page)).toBe('rgb(242, 242, 247)');

  await group.getByRole('radio', { name: 'Escuro' }).click();
  await expect(group.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBg(page)).toBe('rgb(0, 0, 0)');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBg(page)).toBe('rgb(0, 0, 0)');

  // Voltar ao automático segue o sistema (claro neste teste).
  await page.getByRole('radio', { name: 'Automático' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  expect(await bodyBg(page)).toBe('rgb(242, 242, 247)');
});

test.describe('com o sistema no escuro', () => {
  test.use({ colorScheme: 'dark' });

  test('Aparência — Claro sobrepõe o escuro do sistema', async ({ page }) => {
    await openApp(page);
    await goTab(page, 'Mais');
    expect(await bodyBg(page)).toBe('rgb(0, 0, 0)');
    await page.getByRole('radio', { name: 'Claro' }).click();
    expect(await bodyBg(page)).toBe('rgb(242, 242, 247)');
    await expect(page.locator('meta[name="theme-color"]').last()).toHaveAttribute(
      'content',
      '#f2f2f7',
    );
  });
});

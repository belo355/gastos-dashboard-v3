import { expect, test } from '@playwright/test';

test('o app abre no build de produção', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gastos do Dia');
});

import { expect, test } from '@playwright/test';
import { goTab, openApp, seed, todayInSaoPaulo } from './helpers';

test('E2E-13 — Armazenamento indisponível ao salvar', async ({ page }) => {
  await openApp(page);
  // Script de inicialização: bloqueia as gravações na tabela de lançamentos.
  await page.addInitScript(() => {
    for (const method of ['add', 'put'] as const) {
      const original = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore['add']>
      ) {
        if (this.name === 'expenses')
          throw new DOMException('Armazenamento bloqueado', 'UnknownError');
        return original.apply(this, args);
      } as IDBObjectStore['add'];
    }
  });
  await page.reload();

  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill('25,90');
  await dialog.getByRole('radio', { name: 'Alimentação' }).click();
  await dialog.getByLabel(/Descrição/).fill('Almoço');
  await dialog.getByRole('button', { name: 'Salvar' }).click();

  await expect(
    dialog.getByText('Não foi possível salvar no aparelho. Tente de novo.'),
  ).toBeVisible();
  await expect(dialog.getByLabel('Valor')).toHaveValue('25,90');
  await expect(dialog.getByRole('radio', { name: 'Alimentação' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(dialog.getByLabel(/Descrição/)).toHaveValue('Almoço');
});

test('E2E-13 — IndexedDB indisponível na abertura mostra a tela de erro', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function () {
      throw new DOMException('Bloqueado', 'SecurityError');
    };
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir seus dados' }),
  ).toBeVisible();
  await expect(page.getByText('Não foi possível salvar no aparelho. Tente de novo.')).toBeVisible();
});

test('E2E-14 — Apagar dados do aparelho', async ({ page }) => {
  await openApp(page);
  await seed(page, {
    expenses: [{ date: todayInSaoPaulo().iso, categoryId: 'lazer', amountCents: 5000 }],
  });
  await expect(page.getByTestId('month-total')).toHaveText('R$ 50,00');

  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Apagar do aparelho/ }).click();
  await page.getByRole('button', { name: 'Apagar do aparelho' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Apagar todos os dados?' });
  await expect(confirm).toContainText('não pode ser desfeita');
  await confirm.getByRole('button', { name: 'Apagar tudo' }).click();

  await expect(page.getByRole('heading', { name: 'Lance seus gastos em segundos' })).toBeVisible();
  await page.getByRole('button', { name: 'Pular' }).click();
  await page.getByRole('button', { name: 'Começar vazio' }).click();
  await expect(page.getByTestId('month-total')).toHaveText('R$ 0,00');
  await goTab(page, 'Lançamentos');
  await expect(page.getByTestId('expense-row')).toHaveCount(0);
});

test('boas-vindas com exemplo e tela de privacidade', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('privacy-notice')).toContainText(
    'Seus dados ficam só neste aparelho',
  );
  await page.getByRole('button', { name: 'Pular' }).click();
  await page.getByRole('button', { name: 'Ver um exemplo com dados fictícios' }).click();
  await expect(page.getByTestId('sample-banner')).toContainText('Exemplo · dados fictícios');
  await expect(page.getByTestId('bubble').first()).toBeVisible();

  await goTab(page, 'Mais');
  await page.getByRole('link', { name: /Privacidade e sobre/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Seus dados ficam só neste aparelho' }),
  ).toBeVisible();
});

import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { goTab, openApp, seed, todayInSaoPaulo } from './helpers';

const FIXTURE = fileURLToPath(new URL('../fixtures/ca15-20-linhas.xlsx', import.meta.url));

async function audit(page: Page, label: string) {
  // Espera animações de entrada terminarem para medir o estado final.
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map(
      (v) =>
        `${label}: ${v.id} — ${v.help} (${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')})`,
    ),
  ).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`E2E-12 — Acessibilidade das telas principais (tema ${scheme === 'light' ? 'claro' : 'escuro'})`, () => {
    test.use({ colorScheme: scheme });

    test('Resumo, Lançamentos, Orçamento, formulário e importação sem violações sérias', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const csp: string[] = [];
      page.on('console', (m) => {
        if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text());
      });

      await openApp(page);
      const { iso, month } = todayInSaoPaulo();
      await seed(page, {
        expenses: [
          { date: iso, categoryId: 'mercado', amountCents: 43000, description: 'Feira' },
          { date: iso, categoryId: 'lazer', amountCents: 12000, description: 'Cinema' },
          { date: iso, categoryId: 'transporte', amountCents: 5000, description: 'Ônibus' },
          { date: iso, categoryId: 'saude', amountCents: 9000, description: 'Farmácia' },
        ],
        budgets: [
          { categoryId: 'mercado', effectiveFrom: month, limitCents: 50000 },
          { categoryId: 'lazer', effectiveFrom: month, limitCents: 10000 },
          { categoryId: 'transporte', effectiveFrom: month, limitCents: 50000 },
        ],
      });

      await expect(page.getByTestId('bubble')).toHaveCount(4);
      await audit(page, 'Resumo');

      // Cada estado de orçamento tem texto além da cor.
      for (const [cat, state] of [
        ['transporte', 'Dentro do limite'],
        ['mercado', 'Em alerta'],
        ['lazer', 'Estourado'],
      ] as const) {
        await expect(
          page
            .locator(`[data-testid="budget-row"][data-category="${cat}"]`)
            .getByTestId('budget-state'),
        ).toHaveText(state);
      }

      await goTab(page, 'Lançamentos');
      await expect(page.getByTestId('expense-row')).toHaveCount(4);
      await audit(page, 'Lançamentos');

      await goTab(page, 'Orçamento');
      await expect(page.getByTestId('budget-row')).toHaveCount(3);
      await audit(page, 'Orçamento');

      await page.getByTestId('launch-button').click();
      const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
      await dialog.getByRole('button', { name: 'Salvar' }).click();
      await expect(dialog.getByText('Informe o valor')).toBeVisible();
      await audit(page, 'Formulário');
      await page.keyboard.press('Escape');

      await goTab(page, 'Mais');
      await audit(page, 'Mais');
      await page.getByRole('link', { name: /Importar planilha/ }).click();
      await page.getByLabel('Escolher planilhas (.xlsx)').setInputFiles(FIXTURE);
      await expect(page.getByTestId('preview-valid')).toBeVisible();
      await audit(page, 'Importação');

      expect(csp).toEqual([]);
    });
  });
}

test('alvos de toque têm pelo menos 44 × 44 px e não há rolagem horizontal em 320 px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openApp(page);
  await seed(page, {
    expenses: [
      {
        date: todayInSaoPaulo().iso,
        categoryId: 'educacao',
        amountCents: 123456789 % 99999999,
        description: 'Um curso com um nome bem comprido para testar a quebra',
      },
    ],
  });
  for (const tab of ['Resumo', 'Lançamentos', 'Orçamento', 'Mais'] as const) {
    await goTab(page, tab);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `rolagem horizontal em ${tab}`).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          'main button, main a, nav a, [data-testid="launch-button"]',
        ),
      ]
        .filter((el) => el.offsetParent !== null && !el.classList.contains('sr-only'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(
          ({ el, r }) =>
            `${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`,
        ),
    );
    expect(small, `alvos pequenos em ${tab}`).toEqual([]);
  }
});

test('navegação por teclado: foco visível e formulário completo', async ({ page, browserName }) => {
  await openApp(page);
  // No WebKit (como no Safari), Tab não passa por links por padrão.
  if (browserName !== 'webkit') {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  }
  await page.getByTestId('launch-button').focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await expect(dialog.getByLabel('Valor')).toBeFocused();
  await page.keyboard.type('12,50');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight'); // Alimentação → Mercado
  await expect(dialog.getByRole('radio', { name: 'Mercado' })).toBeFocused();
  const outline = await dialog
    .getByRole('radio', { name: 'Mercado' })
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  await dialog.getByRole('button', { name: 'Salvar' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('launch-button')).toBeFocused();
  await expect(page.getByTestId('month-total')).toHaveText('R$ 12,50');
});

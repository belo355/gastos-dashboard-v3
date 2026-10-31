import { expect, test, type Page } from '@playwright/test';
import { addMonths, goTab, openApp, seed, skipOnboarding, todayInSaoPaulo } from './helpers';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const monthName = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1]!;

const parseBRL = (s: string) =>
  Math.round(Number(s.replace(/[^\d,]/g, '').replace(',', '.')) * 100);
const parsePct = (s: string) => Number(s.replace('%', '').replace(',', '.'));

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await skipOnboarding(page);
});

async function seedThree(
  page: Page,
  extra: { date: string; categoryId: string; amountCents: number }[] = [],
) {
  const { iso } = todayInSaoPaulo();
  await seed(page, {
    expenses: [
      { date: iso, categoryId: 'mercado', amountCents: 82000 },
      { date: iso, categoryId: 'transporte', amountCents: 51290 },
      { date: iso, categoryId: 'lazer', amountCents: 51300 },
      ...extra,
    ],
  });
}

test('E2E-03 — Resumo, percentuais e detalhe por categoria', async ({ page }) => {
  await seedThree(page);
  const rows = page.getByTestId('ranking-row');
  await expect(rows).toHaveCount(3);
  await expect(page.getByTestId('bubble')).toHaveCount(3);

  const percents = (await page.getByTestId('ranking-percent').allTextContents()).map(parsePct);
  expect(Math.round(percents.reduce((a, b) => a + b, 0) * 10) / 10).toBe(100);
  const values = (await page.getByTestId('ranking-value').allTextContents()).map(parseBRL);
  await expect(page.getByTestId('month-total')).toHaveText('R$ 1.845,90');
  expect(values.reduce((a, b) => a + b, 0)).toBe(184590);
  expect(
    await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category)),
  ).toEqual(['mercado', 'lazer', 'transporte']);

  // Toque numa bolha abre a lista filtrada.
  await page.locator('[data-testid="bubble"][data-category="lazer"]').click();
  await expect(page).toHaveURL(/\/lancamentos\?categoria=lazer/);
  await expect(page.getByTestId('expense-row')).toHaveCount(1);
  await expect(page.getByTestId('expense-row')).toContainText('Lazer');

  // Toque numa linha do ranking também.
  await goTab(page, 'Resumo');
  await rows.filter({ hasText: 'Mercado' }).click();
  await expect(page).toHaveURL(/categoria=mercado/);
  await expect(page.getByTestId('expense-row')).toHaveCount(1);
  await expect(page.getByTestId('expense-row')).toContainText('Mercado');
});

test('E2E-03 — atualização após salvar em até 300 ms com 5.000 lançamentos', async ({ page }) => {
  // Gravar 5.000 registros direto no IndexedDB é lento no WebKit; só a semeadura precisa desse tempo.
  test.setTimeout(180_000);
  const { iso } = todayInSaoPaulo();
  const cats = [
    'alimentacao',
    'mercado',
    'moradia',
    'transporte',
    'carro',
    'saude',
    'educacao',
    'lazer',
    'jogos',
    'vestuario',
    'familia',
    'outros',
  ];
  const many = Array.from({ length: 5000 }, (_, i) => ({
    date: iso,
    categoryId: cats[i % cats.length]!,
    amountCents: 100 + (i % 97),
  }));
  await seed(page, { expenses: many });
  await expect(page.getByTestId('ranking-row')).toHaveCount(12);
  const before = parseBRL((await page.getByTestId('month-total-live').textContent()) ?? '');
  const expected = `R$ ${((before + 1234) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  await page.getByTestId('launch-button').click();
  const dialog = page.getByRole('dialog', { name: 'Lançar gasto' });
  await dialog.getByLabel('Valor').fill('12,34');
  await dialog.getByRole('radio', { name: 'Jogos' }).click();

  // Mede dentro da página: do clique em Salvar até o total final aparecer.
  await page.evaluate((expectedText) => {
    const w = window as unknown as { __t0?: number; __dt?: Promise<number> };
    const target = document.querySelector('[data-testid="month-total-live"]')!;
    w.__dt = new Promise<number>((resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(`sem atualização: "${target.textContent}" ≠ "${expectedText}", t0=${w.__t0}`),
          ),
        5000,
      );
      const obs = new MutationObserver(() => {
        if (target.textContent?.replace(/\s/g, ' ') === expectedText && w.__t0 !== undefined) {
          obs.disconnect();
          resolve(performance.now() - w.__t0);
        }
      });
      obs.observe(target, { childList: true, characterData: true, subtree: true });
    });
    document
      .querySelector('[role="dialog"] button[type="submit"]')!
      .addEventListener('click', () => (w.__t0 = performance.now()), { capture: true, once: true });
  }, expected);
  await dialog.getByRole('button', { name: 'Salvar' }).click();
  const dt = await page.evaluate(() => (window as unknown as { __dt: Promise<number> }).__dt);
  console.log(`salvar → resumo: ${dt.toFixed(0)} ms`);
  expect(dt).toBeLessThanOrEqual(300);
});

test('E2E-04 — Comparação com o mês anterior', async ({ page }) => {
  const { iso, month } = todayInSaoPaulo();
  const prev = addMonths(month, -1);
  await seed(page, {
    expenses: [
      { date: iso, categoryId: 'mercado', amountCents: 184590 },
      { date: `${prev}-15`, categoryId: 'mercado', amountCents: 196590 },
    ],
  });
  const comparison = page.getByTestId('month-comparison');
  await expect(comparison).toContainText(`Gastou menos que em ${monthName(prev)}`);
  await expect(comparison).toContainText('−R$ 120,00 (−6,1%)');

  await page.getByRole('button', { name: 'Mês anterior' }).click();
  await expect(page.getByTestId('month-comparison')).toContainText('Primeiro mês com gastos');
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await expect(page.getByTestId('month-comparison')).toContainText(
    `Gastou menos que em ${monthName(month)}`,
  );
  await expect(page.getByTestId('month-comparison')).toContainText('(−100%)');
});

test.describe('E2E-11 — Movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('as bolhas renderizam sem transição', async ({ page }) => {
    await seedThree(page);
    const svg = page.getByTestId('category-bubbles');
    await expect(svg).toHaveAttribute('data-motion', 'off');
    const info = await page.evaluate(() => {
      const groups = [...document.querySelectorAll<SVGGElement>('[data-testid="bubble"]')];
      return {
        count: groups.length,
        transforms: groups.map((g) => g.getAttribute('transform')),
        inlineStyles: groups.map((g) => g.getAttribute('style') ?? ''),
        animations: document
          .querySelector('[data-testid="category-bubbles"]')!
          .getAnimations({ subtree: true })
          .map(
            (a) =>
              `${(a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName ?? a.constructor.name} on ${((a.effect as KeyframeEffect).target as Element)?.tagName}`,
          ),
      };
    });
    expect(info.count).toBe(3);
    for (const t of info.transforms) expect(t).toMatch(/^translate\(/);
    for (const s of info.inlineStyles) expect(s).not.toMatch(/transform|opacity/);
    expect(info.animations).toEqual([]);
  });
});

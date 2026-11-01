import { expect, type Page } from '@playwright/test';

export interface SeedExpense {
  date: string;
  categoryId: string;
  amountCents: number;
  description?: string | null;
  walletId?: string;
}

export interface SeedBudget {
  categoryId: string;
  effectiveFrom: string;
  limitCents: number | null;
  walletId?: string;
}

export interface SeedWallet {
  id: string;
  name: string;
  isSample?: boolean;
}

/**
 * Abre o app já depois das boas-vindas: no primeiro acesso o app cria a carteira padrão
 * e mostra o onboarding; o helper o marca como feito e recarrega.
 */
export async function openApp(page: Page, path = '/') {
  await page.goto(path);
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  const welcome = page.getByText(/^Passo 1 de 3$/);
  await expect(nav.or(welcome)).toBeVisible();
  if (await welcome.isVisible()) {
    await skipOnboarding(page);
    await page.reload();
  }
  await expect(nav).toBeVisible();
}

/** Marca o onboarding como feito, para os testes irem direto às telas. */
export async function skipOnboarding(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('gastos-db');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const get = store.get('app');
      get.onsuccess = () => {
        if (get.result) store.put({ ...get.result, onboardingDone: true });
      };
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  });
}

/**
 * Grava dados direto no IndexedDB do app e recarrega a página.
 * Lançamentos e orçamentos sem walletId vão para a carteira ativa.
 */
export async function seed(
  page: Page,
  data: {
    expenses?: SeedExpense[];
    budgets?: SeedBudget[];
    wallets?: SeedWallet[];
    activeWalletId?: string;
  },
) {
  await page.evaluate(async (data) => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('gastos-db');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const tx = db.transaction(['wallets', 'expenses', 'budgets', 'settings'], 'readwrite');
    const settings = tx.objectStore('settings');
    const current = await new Promise<{ activeWalletId: string } & Record<string, unknown>>(
      (res) => {
        const g = settings.get('app');
        g.onsuccess = () => res(g.result);
      },
    );
    const active = current.activeWalletId;
    const now = new Date().toISOString();
    for (const w of data.wallets ?? []) {
      tx.objectStore('wallets').put({ isSample: false, createdAt: now, ...w });
    }
    let i = 0;
    for (const e of data.expenses ?? []) {
      i++;
      const created = new Date(Date.parse(now) + i).toISOString();
      tx.objectStore('expenses').put({
        id: crypto.randomUUID(),
        walletId: e.walletId ?? active,
        date: e.date,
        month: e.date.slice(0, 7),
        categoryId: e.categoryId,
        amountCents: e.amountCents,
        description: e.description ?? null,
        createdAt: created,
        updatedAt: created,
      });
    }
    for (const b of data.budgets ?? []) {
      const walletId = b.walletId ?? active;
      tx.objectStore('budgets').put({
        id: `${walletId}:${b.categoryId}:${b.effectiveFrom}`,
        walletId,
        ...b,
      });
    }
    settings.put({
      ...current,
      onboardingDone: true,
      ...(data.activeWalletId ? { activeWalletId: data.activeWalletId } : {}),
    });
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, data);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
}

/** Data de hoje e mês corrente no fuso do navegador do teste (America/Sao_Paulo). */
export function todayInSaoPaulo(): { iso: string; br: string; month: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = parts.split('-');
  return { iso: parts, br: `${d}/${m}/${y}`, month: `${y}-${m}` };
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const t = y * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/** Abre a aba pela navegação inferior. */
export async function goTab(
  page: Page,
  name: 'Resumo' | 'Lançamentos' | 'Investimentos' | 'Orçamento' | 'Mais',
) {
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name })
    .click();
}

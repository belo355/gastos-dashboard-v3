import type { Settings, Wallet } from '../domain/types';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import { guard } from './storageGuard';
import { DEFAULT_WALLET_NAME } from './walletRepository';

const SETTINGS_ID = 'app' as const;

function defaultWallet(): Wallet {
  return { id: newId(), name: DEFAULT_WALLET_NAME, isSample: false, createdAt: nowIso() };
}

export const settingsRepository = {
  get(): Promise<Settings | undefined> {
    return guard('settings.get', () => db.settings.get(SETTINGS_ID));
  },

  /**
   * Garante as preferências e uma carteira ativa válida.
   * No primeiro uso cria a carteira padrão; se a ativa sumiu, escolhe outra (ou recria a padrão).
   * Roda numa transação, então chamadas simultâneas não criam carteiras duplicadas.
   */
  ensureInitialized(): Promise<Settings> {
    return guard('settings.init', () =>
      db.transaction('rw', db.wallets, db.settings, async () => {
        const current = await db.settings.get(SETTINGS_ID);
        if (current && (await db.wallets.get(current.activeWalletId))) return current;

        let wallet = await db.wallets.orderBy('createdAt').first();
        if (!wallet) {
          wallet = defaultWallet();
          await db.wallets.add(wallet);
        }
        const settings: Settings = current
          ? { ...current, activeWalletId: wallet.id }
          : {
              id: SETTINGS_ID,
              activeWalletId: wallet.id,
              onboardingDone: false,
              persistenceGranted: null,
              lastExportAt: null,
            };
        await db.settings.put(settings);
        return settings;
      }),
    );
  },

  update(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
    return guard('settings.update', async () => {
      await db.settings.update(SETTINGS_ID, patch);
    });
  },

  setActiveWallet(walletId: string): Promise<void> {
    return this.update({ activeWalletId: walletId });
  },

  /** Apaga tudo do aparelho (carteiras, lançamentos, orçamentos e preferências). */
  wipeAll(): Promise<void> {
    return guard('settings.wipe', () =>
      db.transaction('rw', db.wallets, db.expenses, db.budgets, db.settings, async () => {
        await Promise.all([
          db.wallets.clear(),
          db.expenses.clear(),
          db.budgets.clear(),
          db.settings.clear(),
        ]);
      }),
    );
  },
};

import { validateWalletName } from '../domain/walletName';
import type { Wallet } from '../domain/types';
import { AppError } from '../lib/errors';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import type { WalletRepository } from './repositories';
import { guard } from './storageGuard';

export const DEFAULT_WALLET_NAME = 'Pessoal';

function checkName(name: string, existing: Wallet[], selfId?: string): string {
  const r = validateWalletName(name, existing, selfId);
  if (!r.ok) {
    throw new AppError(r.error === 'wallet_name_taken' ? 'wallet_name_taken' : 'invalid_name', {
      message: r.message,
    });
  }
  return r.value;
}

export const walletRepository: WalletRepository = {
  list() {
    return guard('wallets.list', () => db.wallets.orderBy('createdAt').toArray());
  },

  /** Nome obrigatório e único (sem diferenciar maiúsculas e acentos); checado na mesma transação. */
  create(name, options) {
    return guard('wallets.create', () =>
      db.transaction('rw', db.wallets, async () => {
        const value = checkName(name, await db.wallets.toArray());
        const wallet: Wallet = {
          id: newId(),
          name: value,
          isSample: options?.isSample ?? false,
          createdAt: nowIso(),
        };
        await db.wallets.add(wallet);
        return wallet;
      }),
    );
  },

  rename(id, name) {
    return guard('wallets.rename', () =>
      db.transaction('rw', db.wallets, async () => {
        const all = await db.wallets.toArray();
        if (!all.some((w) => w.id === id)) throw new AppError('not_found');
        await db.wallets.update(id, { name: checkName(name, all, id) });
      }),
    );
  },

  /** Apaga a carteira com seus lançamentos e orçamentos, numa transação. */
  remove(id) {
    return guard('wallets.remove', () =>
      db.transaction('rw', db.wallets, db.expenses, db.budgets, async () => {
        await db.expenses.where('walletId').equals(id).delete();
        await db.budgets.where('walletId').equals(id).delete();
        await db.wallets.delete(id);
      }),
    );
  },
};

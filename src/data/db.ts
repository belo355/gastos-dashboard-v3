import { Dexie, type EntityTable } from 'dexie';
import type { BudgetRecord, Expense, Settings, Wallet } from '../domain/types';

export const DB_NAME = 'gastos-db';

export class GastosDB extends Dexie {
  wallets!: EntityTable<Wallet, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  budgets!: EntityTable<BudgetRecord, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name = DB_NAME) {
    super(name);
    // v1. Mudanças futuras exigem uma nova version() com upgrade().
    this.version(1).stores({
      wallets: 'id, createdAt',
      expenses: 'id, walletId, [walletId+month], [walletId+month+categoryId]',
      budgets: 'id, walletId, [walletId+categoryId]',
      settings: 'id',
    });
  }
}

export const db = new GastosDB();

export const ALL_TABLES = () => [db.wallets, db.expenses, db.budgets, db.settings];

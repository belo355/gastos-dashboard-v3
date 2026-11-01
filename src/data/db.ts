import { Dexie, type EntityTable } from 'dexie';
import type { Investment, InvestmentEntry, MarketRefs } from '../domain/investments';
import type { BudgetRecord, Expense, Settings, Wallet } from '../domain/types';

export const DB_NAME = 'gastos-db';

/** Taxas de referência dos investimentos (um registro só). */
export interface MarketRefsRecord extends MarketRefs {
  id: 'refs';
}

export class GastosDB extends Dexie {
  wallets!: EntityTable<Wallet, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  budgets!: EntityTable<BudgetRecord, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  investments!: EntityTable<Investment, 'id'>;
  investmentEntries!: EntityTable<InvestmentEntry, 'id'>;
  marketRefs!: EntityTable<MarketRefsRecord, 'id'>;

  constructor(name = DB_NAME) {
    super(name);
    // Mudanças em tabelas existentes exigem uma nova version() com upgrade().
    this.version(1).stores({
      wallets: 'id, createdAt',
      expenses: 'id, walletId, [walletId+month], [walletId+month+categoryId]',
      budgets: 'id, walletId, [walletId+categoryId]',
      settings: 'id',
    });
    // v2: investimentos (tabelas novas, sem migração de dados).
    this.version(2).stores({
      investments: 'id, type, createdAt',
      investmentEntries: 'id, investmentId, date',
      marketRefs: 'id',
    });
  }
}

export const db = new GastosDB();

export const ALL_TABLES = () => [
  db.wallets,
  db.expenses,
  db.budgets,
  db.settings,
  db.investments,
  db.investmentEntries,
  db.marketRefs,
];

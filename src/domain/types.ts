import type { CategoryId } from './categories';

/** Mês no formato `YYYY-MM`. */
export type MonthKey = string;
/** Data local no formato `YYYY-MM-DD`. */
export type DateString = string;

export interface Wallet {
  id: string;
  name: string;
  isSample: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  walletId: string;
  date: DateString;
  month: MonthKey;
  categoryId: CategoryId;
  amountCents: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  walletId: string;
  date: DateString;
  categoryId: CategoryId;
  amountCents: number;
  description: string | null;
}

export interface BudgetRecord {
  id: string;
  walletId: string;
  categoryId: CategoryId;
  effectiveFrom: MonthKey;
  limitCents: number | null;
}

export interface Settings {
  id: 'app';
  activeWalletId: string;
  onboardingDone: boolean;
  persistenceGranted: boolean | null;
  lastExportAt: string | null;
}

export interface CategoryTotal {
  categoryId: CategoryId;
  totalCents: number;
  count: number;
  percent: number;
  rank: number;
}

export interface MonthSummary {
  totalCents: number;
  count: number;
  categories: CategoryTotal[];
}

export type ComparisonDirection = 'more' | 'less' | 'equal' | 'no_previous';

export interface MonthComparison {
  deltaCents: number;
  deltaPercent: number | null;
  direction: ComparisonDirection;
}

export type BudgetState = 'ok' | 'warning' | 'over';

export interface BudgetProgress {
  spentCents: number;
  limitCents: number;
  ratio: number;
  status: BudgetState;
  remainingCents: number;
  excessCents: number;
}

import { createContext, useContext } from 'react';
import type { EntryKind, Investment, InvestmentEntry } from '../../domain/investments';

/** Ações que abrem os formulários da aba Investimentos (cadastro, movimentação, taxas). */
export interface InvestmentActions {
  newInvestment: () => void;
  editInvestment: (inv: Investment) => void;
  newEntry: (opts?: { investmentId?: string; kind?: EntryKind }) => void;
  editEntry: (entry: InvestmentEntry) => void;
  openRates: () => void;
}

export const InvestmentActionsContext = createContext<InvestmentActions | null>(null);

export function useInvestmentActions(): InvestmentActions {
  const ctx = useContext(InvestmentActionsContext);
  if (!ctx) throw new Error('useInvestmentActions fora de InvestmentsPage');
  return ctx;
}

/** Disparado pelo botão "Lançar" da barra quando a aba Investimentos está aberta. */
export const INVESTMENT_LAUNCH_EVENT = 'gastos:investment-launch';

import { budgetPercent } from '../../domain/budget';
import { formatMoney } from '../../domain/money';
import type { BudgetProgress, BudgetState } from '../../domain/types';

export const STATE_LABEL: Record<BudgetState, string> = {
  ok: 'Dentro do limite',
  warning: 'Em alerta',
  over: 'Estourado',
};

/** "R$ 320,00 de R$ 500,00" */
export function spentOfLimit(p: BudgetProgress): string {
  return `${formatMoney(p.spentCents)} de ${formatMoney(p.limitCents)}`;
}

/** Texto positivo do que resta (ou do excesso). */
export function remainingText(p: BudgetProgress): string {
  if (p.status === 'over') return `${formatMoney(p.excessCents)} acima do limite`;
  if (p.status === 'warning')
    return p.remainingCents === 0
      ? 'Limite atingido'
      : `Faltam ${formatMoney(p.remainingCents)} para o limite`;
  return `Restam ${formatMoney(p.remainingCents)}`;
}

export function percentText(p: BudgetProgress): string {
  return `${budgetPercent(p)}%`;
}

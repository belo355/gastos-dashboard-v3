import { formatMoney } from '../../domain/money';

const MINUS = String.fromCharCode(0x2212);
const COMPACT = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const PCT2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** +R$ 1.234,56 / −R$ 12,00 (sinal tipográfico de menos). */
export function signedMoney(cents: number): string {
  if (cents === 0) return formatMoney(0);
  return `${cents > 0 ? '+' : MINUS}${formatMoney(Math.abs(cents))}`;
}

/** +13,01% / −4,85%. */
export function signedPercent(value: number): string {
  if (Math.abs(value) < 0.005) return '0,00%';
  return `${value > 0 ? '+' : MINUS}${PCT2.format(Math.abs(value))}%`;
}

/** Eixo do gráfico: "R$ 250 mil", "R$ 1,2 mi". */
export function compactMoney(cents: number): string {
  return `R$ ${COMPACT.format(cents / 100)}`;
}

/** Classe de cor para ganho (verde), perda (vermelho) ou neutro. */
export function gainTone(cents: number): string {
  return cents > 0 ? 'text-ok' : cents < 0 ? 'text-danger' : 'text-muted';
}

/** Maior valor aceito: R$ 999.999,99. */
export const MAX_AMOUNT_CENTS = 99_999_999;

const NBSP = String.fromCharCode(0xa0);
const NBSP_ALL = new RegExp(NBSP, 'g');
const WHITESPACE = new RegExp('[\\s' + NBSP + ']', 'g');

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DECIMAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converte texto em pt-BR para centavos.
 * Aceita "25,90", "1.234,56", "R$ 5", "12.5"; devolve null para vazio, zero,
 * negativo, ilegível ou acima do máximo.
 */
export function parseMoney(text: string, max: number = MAX_AMOUNT_CENTS): number | null {
  let s = text.replace(/R\$/gi, '').replace(WHITESPACE, '');
  if (s === '' || s.startsWith('-')) return null;

  let intPart: string;
  let fracPart = '';
  if (s.includes(',')) {
    // Vírgula é o separador decimal; pontos são milhar.
    const [i, f, ...rest] = s.split(',');
    if (rest.length > 0) return null;
    if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(i!)) return null;
    intPart = i!.replace(/\./g, '');
    fracPart = f!;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    intPart = s.replace(/\./g, '');
  } else {
    s = s.replace(/^\./, '0.');
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    intPart = m[1]!;
    fracPart = m[2] ?? '';
  }

  if (!/^\d*$/.test(fracPart) || fracPart.length > 2) return null;
  if (intPart === '') intPart = '0';
  const cents = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > max) return null;
  return cents;
}

/** Converte um número em reais (ex.: célula de planilha) para centavos. */
export function reaisToCents(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  if (cents <= 0 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}

/** 123456 → "R$ 1.234,56" (com espaço comum, não o não separável do Intl). */
export function formatMoney(cents: number): string {
  return BRL.format(cents / 100).replace(NBSP_ALL, ' ');
}

/** Valor sem símbolo para campos de edição: 2590 → "25,90". */
export function formatMoneyInput(cents: number): string {
  return DECIMAL.format(cents / 100).replace(NBSP_ALL, ' ');
}

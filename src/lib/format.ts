const PCT = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const PCT1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 33.4 → "33,4%"; 50 → "50%". */
export function formatPercent(value: number): string {
  return `${PCT.format(value)}%`;
}

/** Sempre com uma casa: 50 → "50,0%". */
export function formatPercent1(value: number): string {
  return `${PCT1.format(value)}%`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

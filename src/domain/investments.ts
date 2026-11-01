import { z } from 'zod';
import { isValidDate, lastDayOfMonth, monthKey, today } from './dates';
import type { DateString, MonthKey } from './types';

/*
 * Investimentos: ativos, movimentações e o cálculo do patrimônio.
 *
 * O app não busca cotações (nenhum dado sai do aparelho). O valor de cada ativo vem de:
 *  1. "saldo informado" pelo usuário (o que aparece no banco/corretora), quando houver;
 *  2. a taxa do ativo (% do CDI, prefixado ou IPCA+), que projeta o valor entre um saldo
 *     informado e outro, e até hoje. Sem taxa, o valor só muda com aportes, resgates e saldos.
 * Ganho de capital = patrimônio − valor aplicado.
 */

/** Maior valor aceito por movimentação: R$ 999.999.999,99. */
export const INVESTMENT_MAX_CENTS = 99_999_999_999;
export const INVESTMENT_NAME_MAX = 60;
export const ENTRY_NOTE_MAX = 80;

export const INVESTMENT_TYPES = [
  'renda-fixa',
  'tesouro',
  'acoes',
  'fiis',
  'fundos',
  'cripto',
  'previdencia',
  'outros',
] as const;
export type InvestmentTypeId = (typeof INVESTMENT_TYPES)[number];

export interface InvestmentTypeMeta {
  id: InvestmentTypeId;
  name: string;
  /** Token CSS da cor (reaproveita as cores de categoria, já testadas em contraste). */
  colorVar: string;
}

const TYPE_META: Record<InvestmentTypeId, [name: string, colorVar: string]> = {
  'renda-fixa': ['Renda fixa', '--cat-moradia'],
  tesouro: ['Tesouro Direto', '--cat-transporte'],
  acoes: ['Ações', '--cat-mercado'],
  fiis: ['Fundos imobiliários', '--cat-alimentacao'],
  fundos: ['Fundos', '--cat-educacao'],
  cripto: ['Criptomoedas', '--cat-jogos'],
  previdencia: ['Previdência', '--cat-familia'],
  outros: ['Outros', '--cat-outros'],
};

export function getInvestmentType(id: InvestmentTypeId): InvestmentTypeMeta {
  const [name, colorVar] = TYPE_META[id];
  return { id, name, colorVar };
}

export const INVESTMENT_TYPE_LIST: readonly InvestmentTypeMeta[] =
  INVESTMENT_TYPES.map(getInvestmentType);

export function isInvestmentType(v: unknown): v is InvestmentTypeId {
  return typeof v === 'string' && (INVESTMENT_TYPES as readonly string[]).includes(v);
}

/** cdi: % do CDI (ex.: 110); pre: % ao ano (ex.: 12,5); ipca: IPCA + x% ao ano (ex.: 6). */
export type RateKind = 'cdi' | 'pre' | 'ipca';
export interface Rate {
  kind: RateKind;
  value: number;
}

/** Taxas de referência informadas pelo usuário, em % ao ano. */
export interface MarketRefs {
  cdi: number;
  ipca: number;
}

/** Referências iniciais: editáveis em Investimentos → Taxas de referência. */
export const DEFAULT_MARKET_REFS: MarketRefs = { cdi: 14.9, ipca: 4.5 };

export interface Investment {
  id: string;
  name: string;
  type: InvestmentTypeId;
  rate: Rate | null;
  maturity: DateString | null;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EntryKind = 'aporte' | 'resgate' | 'saldo';

export interface InvestmentEntry {
  id: string;
  investmentId: string;
  date: DateString;
  month: MonthKey;
  kind: EntryKind;
  amountCents: number;
  note: string | null;
  createdAt: string;
}

export const ENTRY_LABEL: Record<EntryKind, string> = {
  aporte: 'Aporte',
  resgate: 'Resgate',
  saldo: 'Saldo informado',
};

/* ---------- Taxas ---------- */

/** Taxa anual efetiva (fração: 0,12 = 12% a.a.). */
export function annualRate(rate: Rate | null, refs: MarketRefs): number {
  if (!rate) return 0;
  switch (rate.kind) {
    case 'pre':
      return rate.value / 100;
    case 'cdi':
      return (refs.cdi / 100) * (rate.value / 100);
    case 'ipca':
      return (1 + refs.ipca / 100) * (1 + rate.value / 100) - 1;
  }
}

const RATE_FMT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** "110% do CDI", "12,5% a.a.", "IPCA + 6% a.a.". */
export function formatRate(rate: Rate): string {
  const v = RATE_FMT.format(rate.value);
  if (rate.kind === 'cdi') return `${v}% do CDI`;
  if (rate.kind === 'pre') return `${v}% a.a.`;
  return `IPCA + ${v}% a.a.`;
}

/** Converte "110", "12,5" ou "6.25" em número; null se vazio ou ilegível. */
export function parseRateValue(text: string): number | null {
  const s = text.trim().replace('%', '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,4})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ---------- Validação ---------- */

const RATE_LIMITS: Record<RateKind, [min: number, max: number, message: string]> = {
  cdi: [1, 500, 'Informe um percentual do CDI entre 1% e 500%'],
  pre: [0.01, 200, 'Informe uma taxa entre 0,01% e 200% ao ano'],
  ipca: [-10, 50, 'Informe um adicional entre -10% e 50% ao ano'],
};

export interface InvestmentInput {
  name: string;
  type: InvestmentTypeId;
  rate: Rate | null;
  maturity: DateString | null;
}

export type InvestmentErrors = Partial<Record<'name' | 'type' | 'rate' | 'maturity', string>>;

export function validateInvestmentInput(
  input: Partial<InvestmentInput>,
): { ok: true; value: InvestmentInput } | { ok: false; errors: InvestmentErrors } {
  const errors: InvestmentErrors = {};
  const name = (input.name ?? '').trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'Informe o nome do investimento';
  else if (name.length > INVESTMENT_NAME_MAX)
    errors.name = `Use até ${INVESTMENT_NAME_MAX} caracteres`;
  if (!isInvestmentType(input.type)) errors.type = 'Escolha o tipo';
  const rate = input.rate ?? null;
  if (rate) {
    const [min, max, message] = RATE_LIMITS[rate.kind];
    if (!Number.isFinite(rate.value) || rate.value < min || rate.value > max) errors.rate = message;
  }
  const maturity = input.maturity ?? null;
  if (maturity !== null && !isValidDate(maturity)) errors.maturity = 'Data inválida';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, type: input.type!, rate, maturity } };
}

export interface EntryInput {
  investmentId: string;
  date: DateString;
  kind: EntryKind;
  amountCents: number;
  note: string | null;
}

export type EntryErrors = Partial<Record<'investmentId' | 'date' | 'amountCents' | 'note', string>>;

const entrySchema = z.object({
  investmentId: z.string().min(1, 'Escolha o investimento'),
  date: z
    .string()
    .refine(isValidDate, 'Data inválida')
    .refine((d) => d <= today(), 'A data não pode estar no futuro'),
  kind: z.enum(['aporte', 'resgate', 'saldo']),
  amountCents: z
    .number()
    .int()
    .positive('Informe o valor')
    .max(INVESTMENT_MAX_CENTS, 'Valor acima do máximo'),
  note: z
    .string()
    .trim()
    .max(ENTRY_NOTE_MAX, `Use até ${ENTRY_NOTE_MAX} caracteres`)
    .nullable()
    .transform((v) => (v ? v : null)),
});

export function validateEntryInput(
  input: Partial<EntryInput>,
): { ok: true; value: EntryInput } | { ok: false; errors: EntryErrors } {
  const r = entrySchema.safeParse({ note: null, ...input });
  if (r.success) return { ok: true, value: r.data };
  const errors: EntryErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof EntryErrors;
    if (key && !errors[key]) {
      errors[key] =
        key === 'amountCents' && issue.code !== 'too_big' ? 'Informe o valor' : issue.message;
    }
  }
  return { ok: false, errors };
}

/* ---------- Cálculo ---------- */

const KIND_ORDER: Record<EntryKind, number> = { aporte: 0, resgate: 1, saldo: 2 };

/**
 * Ordem cronológica. No mesmo dia vale a ordem em que o usuário lançou: um aporte lançado
 * depois de informar o saldo soma a esse saldo. Só no empate total (mesmo instante) o saldo
 * fica por último, como valor de fim do dia.
 */
export function chronological(a: InvestmentEntry, b: InvestmentEntry): number {
  return (
    a.date.localeCompare(b.date) ||
    a.createdAt.localeCompare(b.createdAt) ||
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    a.id.localeCompare(b.id)
  );
}

function dayNumber(d: DateString): number {
  return (
    Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / 86_400_000
  );
}

function grow(value: number, from: DateString, to: DateString, annual: number): number {
  if (annual === 0 || value <= 0) return value;
  const days = dayNumber(to) - dayNumber(from);
  return days > 0 ? value * (1 + annual) ** (days / 365) : value;
}

export interface Valuation {
  valueCents: number;
  appliedCents: number;
}

/**
 * Valor e valor aplicado de um ativo em cada data pedida (datas em ordem crescente).
 * Percorre as movimentações uma vez:
 *  - entre eventos, o valor rende pela taxa anual (juros compostos por dias corridos/365);
 *  - aporte soma ao valor e ao aplicado;
 *  - resgate tira do valor e reduz o aplicado na mesma proporção (o resgate leva junto parte do ganho);
 *  - saldo informado substitui o valor calculado.
 */
export function valuationsAt(
  entries: readonly InvestmentEntry[],
  annual: number,
  dates: readonly DateString[],
): Valuation[] {
  const sorted = [...entries].sort(chronological);
  const out: Valuation[] = [];
  let value = 0;
  let applied = 0;
  let cursor: DateString | null = null;
  let i = 0;
  for (const date of dates) {
    while (i < sorted.length && sorted[i]!.date <= date) {
      const e = sorted[i++]!;
      if (cursor) value = grow(value, cursor, e.date, annual);
      cursor = e.date;
      if (e.kind === 'aporte') {
        value += e.amountCents;
        applied += e.amountCents;
      } else if (e.kind === 'resgate') {
        const share = value > 0 ? Math.min(1, e.amountCents / value) : 1;
        applied -= applied * share;
        value = Math.max(0, value - e.amountCents);
      } else {
        value = e.amountCents;
      }
    }
    const shown = cursor ? grow(value, cursor, date, annual) : 0;
    // Avança o cursor: o rendimento até aqui já está em "value" para as próximas datas.
    if (cursor && date > cursor) {
      value = shown;
      cursor = date;
    }
    out.push({ valueCents: Math.round(shown), appliedCents: Math.round(applied) });
  }
  return out;
}

export interface Position extends Valuation {
  investment: Investment;
  gainCents: number;
  /** Ganho sobre o aplicado (%); null sem valor aplicado. */
  returnPercent: number | null;
  /** Participação no patrimônio (%). */
  sharePercent: number;
  lastEntryDate: DateString | null;
  /** Data do último saldo informado. */
  lastBalanceDate: DateString | null;
  /** true quando o valor de hoje vem da taxa (não de um saldo informado hoje). */
  estimated: boolean;
}

export interface TypeTotal {
  type: InvestmentTypeId;
  valueCents: number;
  appliedCents: number;
  gainCents: number;
  sharePercent: number;
  count: number;
}

export interface MonthPoint {
  month: MonthKey;
  /** Data usada no cálculo: fim do mês, ou hoje no mês corrente. */
  date: DateString;
  valueCents: number;
  appliedCents: number;
  gainCents: number;
}

export interface Portfolio {
  positions: Position[];
  byType: TypeTotal[];
  totals: Valuation & { gainCents: number; returnPercent: number | null };
  /** Um ponto por mês, do primeiro mês com movimentação até o mês corrente. */
  history: MonthPoint[];
}

function pct(part: number, whole: number): number | null {
  return whole > 0 ? (part / whole) * 100 : null;
}

/** Monta posições, totais por tipo e o histórico mensal de toda a carteira. */
export function buildPortfolio(
  investments: readonly Investment[],
  entries: readonly InvestmentEntry[],
  refs: MarketRefs,
  reference: DateString = today(),
): Portfolio {
  const byInvestment = new Map<string, InvestmentEntry[]>();
  for (const e of entries) {
    const list = byInvestment.get(e.investmentId);
    if (list) list.push(e);
    else byInvestment.set(e.investmentId, [e]);
  }

  // Meses do primeiro lançamento até o mês de referência.
  const firstDate = entries.reduce<DateString | null>(
    (min, e) => (min === null || e.date < min ? e.date : min),
    null,
  );
  const months: MonthKey[] = [];
  const nowMonth = monthKey(reference);
  if (firstDate) {
    for (let m = monthKey(firstDate); m <= nowMonth; m = nextMonth(m)) months.push(m);
  }
  const dates = months.map((m) => (m === nowMonth ? reference : lastDayOfMonth(m)));
  if (dates[dates.length - 1] !== reference) dates.push(reference);

  const history: MonthPoint[] = months.map((month, k) => ({
    month,
    date: dates[k]!,
    valueCents: 0,
    appliedCents: 0,
    gainCents: 0,
  }));

  const raw: Omit<Position, 'sharePercent'>[] = [];
  for (const investment of investments) {
    const list = byInvestment.get(investment.id) ?? [];
    const annual = annualRate(investment.rate, refs);
    const vals = valuationsAt(list, annual, dates);
    vals.slice(0, months.length).forEach((v, k) => {
      history[k]!.valueCents += v.valueCents;
      history[k]!.appliedCents += v.appliedCents;
    });
    const now = vals[vals.length - 1] ?? { valueCents: 0, appliedCents: 0 };
    let lastEntryDate: DateString | null = null;
    let lastBalanceDate: DateString | null = null;
    for (const e of list) {
      if (e.date > reference) continue;
      if (!lastEntryDate || e.date > lastEntryDate) lastEntryDate = e.date;
      if (e.kind === 'saldo' && (!lastBalanceDate || e.date > lastBalanceDate))
        lastBalanceDate = e.date;
    }
    const gainCents = now.valueCents - now.appliedCents;
    raw.push({
      investment,
      ...now,
      gainCents,
      returnPercent: pct(gainCents, now.appliedCents),
      lastEntryDate,
      lastBalanceDate,
      estimated: annual !== 0 && lastBalanceDate !== reference && now.valueCents > 0,
    });
  }
  for (const p of history) p.gainCents = p.valueCents - p.appliedCents;

  const totalValue = raw.reduce((a, p) => a + p.valueCents, 0);
  const totalApplied = raw.reduce((a, p) => a + p.appliedCents, 0);
  const positions: Position[] = raw
    .map((p) => ({ ...p, sharePercent: pct(p.valueCents, totalValue) ?? 0 }))
    .sort(
      (a, b) =>
        b.valueCents - a.valueCents || a.investment.name.localeCompare(b.investment.name, 'pt-BR'),
    );

  const typeMap = new Map<InvestmentTypeId, TypeTotal>();
  for (const p of positions) {
    const t = typeMap.get(p.investment.type) ?? {
      type: p.investment.type,
      valueCents: 0,
      appliedCents: 0,
      gainCents: 0,
      sharePercent: 0,
      count: 0,
    };
    t.valueCents += p.valueCents;
    t.appliedCents += p.appliedCents;
    t.gainCents += p.gainCents;
    t.count += 1;
    typeMap.set(p.investment.type, t);
  }
  const byType = [...typeMap.values()]
    .map((t) => ({ ...t, sharePercent: pct(t.valueCents, totalValue) ?? 0 }))
    .sort((a, b) => b.valueCents - a.valueCents);

  const totalGain = totalValue - totalApplied;
  return {
    positions,
    byType,
    totals: {
      valueCents: totalValue,
      appliedCents: totalApplied,
      gainCents: totalGain,
      returnPercent: pct(totalGain, totalApplied),
    },
    history,
  };
}

function nextMonth(m: MonthKey): MonthKey {
  const y = Number(m.slice(0, 4));
  const mo = Number(m.slice(5, 7));
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

/** Recorta o histórico: últimos `n` meses (null = tudo). */
export function lastMonths(history: readonly MonthPoint[], n: number | null): MonthPoint[] {
  return n === null ? [...history] : history.slice(-n);
}

/** Mês corrente no formato do eixo: "10/26". */
export function shortMonth(month: MonthKey): string {
  return `${month.slice(5, 7)}/${month.slice(2, 4)}`;
}

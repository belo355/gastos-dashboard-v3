import type { DateString, MonthKey } from './types';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

function toDateString(y: number, m: number, d: number): DateString {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Data de hoje no horário local do aparelho. */
export function today(now: Date = new Date()): DateString {
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function isValidDate(value: unknown): value is DateString {
  if (typeof value !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return y >= 1900 && y <= 9999 && mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

export function isValidMonth(value: unknown): value is MonthKey {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKey(date: DateString): MonthKey {
  return date.slice(0, 7);
}

export function currentMonth(now: Date = new Date()): MonthKey {
  return monthKey(today(now));
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + delta;
  const ny = y + Math.floor(m / 12);
  const nm = ((m % 12) + 12) % 12;
  return `${pad(ny, 4)}-${pad(nm + 1)}`;
}

/** "2026-10" → "Outubro 2026". */
export function formatMonthLabel(month: MonthKey): string {
  return `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

/** "2026-10" → "outubro". */
export function formatMonthName(month: MonthKey): string {
  return MONTHS[Number(month.slice(5, 7)) - 1]!.toLowerCase();
}

/** "2026-10-29" → "29/10/2026". */
export function formatDate(date: DateString): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/** Dias corridos entre duas datas (b − a), sem depender do fuso. */
function dayDiff(a: DateString, b: DateString): number {
  const ms = (d: DateString) =>
    Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return Math.round((ms(b) - ms(a)) / 86_400_000);
}

/**
 * Título de um dia na lista de lançamentos: "Hoje", "Ontem" ou "sexta-feira, 24 de outubro"
 * (o ano só aparece quando não é o ano de hoje).
 */
export function formatDayHeading(date: DateString, reference: DateString = today()): string {
  const diff = dayDiff(date, reference);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
  const base = `${weekday}, ${d} de ${MONTHS[m - 1]!.toLowerCase()}`;
  return y === Number(reference.slice(0, 4)) ? base : `${base} de ${y}`;
}

/** Último dia do mês como data. */
export function lastDayOfMonth(month: MonthKey): DateString {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return toDateString(y, m, daysInMonth(y, m));
}

/** Dias desde 1899-12-30, a época usada pelo Excel (considera o bug de 1900). */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

export function excelSerialToDate(serial: number): DateString | null {
  if (!Number.isFinite(serial) || serial < 1) return null;
  const d = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * DAY_MS);
  return toDateString(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function dateToExcelSerial(date: DateString): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(y, m - 1, d) - EXCEL_EPOCH_UTC) / DAY_MS);
}

/**
 * Converte uma célula de planilha em data:
 * objeto Date (lido em UTC, como as bibliotecas de planilha o entregam),
 * número serial do Excel ou texto `dd/mm/aaaa` / `aaaa-mm-dd`.
 */
export function parseDateCell(value: unknown): DateString | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const s = toDateString(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    return isValidDate(s) ? s : null;
  }
  if (typeof value === 'number') {
    const s = excelSerialToDate(value);
    return s && isValidDate(s) ? s : null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    if (br) {
      const s = toDateString(Number(br[3]), Number(br[2]), Number(br[1]));
      return isValidDate(s) ? s : null;
    }
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
    if (iso) {
      const s = toDateString(Number(iso[1]), Number(iso[2]), Number(iso[3]));
      return isValidDate(s) ? s : null;
    }
  }
  return null;
}

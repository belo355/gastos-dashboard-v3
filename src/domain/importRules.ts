import { matchCategory, normalizeText } from './categories';
import { monthKey, parseDateCell } from './dates';
import { DESCRIPTION_MAX } from './expenseSchema';
import { parseMoney, reaisToCents } from './money';
import type { ExpenseInput, MonthKey } from './types';
import { AppError } from '../lib/errors';

export const MAX_IMPORT_ROWS = 10_000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportRowError = 'invalid_date' | 'invalid_amount' | 'description_too_long';
export type ImportedExpense = Omit<ExpenseInput, 'walletId'>;

export interface ImportPreview {
  valid: ImportedExpense[];
  /** Número da linha na planilha (base 1, contando o cabeçalho). */
  discarded: { row: number; reason: ImportRowError }[];
  blankRows: number;
  remappedToOthers: number;
  months: MonthKey[];
  conflicts: MonthKey[];
}

type Column = 'date' | 'description' | 'category' | 'amount';

const HEADERS: Record<string, Column> = {
  data: 'date',
  descricao: 'description',
  categoria: 'category',
  valor: 'amount',
  'valor (r$)': 'amount',
  'valor r$': 'amount',
};

const REQUIRED: { column: Column; label: string }[] = [
  { column: 'date', label: 'Data' },
  { column: 'category', label: 'Categoria' },
  { column: 'amount', label: 'Valor' },
];

/** Os cabeçalhos exatos gerados pela exportação (e pela planilha modelo). */
export const EXPORT_HEADERS = ['Data', 'Descrição', 'Categoria', 'Valor'] as const;

function isBlank(cell: unknown): boolean {
  return cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '');
}

function parseAmount(cell: unknown): number | null {
  if (typeof cell === 'number') return reaisToCents(cell);
  if (typeof cell === 'string') return parseMoney(cell);
  return null;
}

function parseDescription(cell: unknown): { ok: true; value: string | null } | { ok: false } {
  if (isBlank(cell)) return { ok: true, value: null };
  const text = (cell instanceof Date ? cell.toISOString() : String(cell)).trim();
  if (text.length > DESCRIPTION_MAX) return { ok: false };
  return { ok: true, value: text || null };
}

/**
 * Lê a matriz de células da primeira aba: localiza as colunas pelo cabeçalho
 * (sem acento, sem caixa, em qualquer ordem), valida cada linha e monta a prévia.
 */
export function normalizeRows(
  rows: readonly (readonly unknown[])[],
  existingMonths: readonly MonthKey[] = [],
): ImportPreview {
  if (rows.length > MAX_IMPORT_ROWS + 1) throw new AppError('import_too_large');

  const headerIndex = rows.findIndex((r) => r.some((c) => !isBlank(c)));
  if (headerIndex < 0) throw new AppError('import_empty');

  const columns = new Map<Column, number>();
  rows[headerIndex]!.forEach((cell, i) => {
    if (typeof cell !== 'string') return;
    const col = HEADERS[normalizeText(cell).replace(/\s+/g, ' ')];
    if (col && !columns.has(col)) columns.set(col, i);
  });
  const missing = REQUIRED.filter((r) => !columns.has(r.column)).map((r) => r.label);
  if (missing.length > 0) {
    throw new AppError('import_missing_columns', {
      message: `A planilha não tem as colunas: ${missing.join(', ')}.`,
      details: missing,
    });
  }

  const at = (row: readonly unknown[], col: Column) => {
    const i = columns.get(col);
    return i === undefined ? null : row[i];
  };

  const preview: ImportPreview = {
    valid: [],
    discarded: [],
    blankRows: 0,
    remappedToOthers: 0,
    months: [],
    conflicts: [],
  };
  const months = new Set<MonthKey>();

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 1;
    if (row.every(isBlank)) {
      preview.blankRows++;
      continue;
    }
    const date = parseDateCell(at(row, 'date'));
    if (!date) {
      preview.discarded.push({ row: rowNumber, reason: 'invalid_date' });
      continue;
    }
    const amountCents = parseAmount(at(row, 'amount'));
    if (amountCents === null) {
      preview.discarded.push({ row: rowNumber, reason: 'invalid_amount' });
      continue;
    }
    const description = parseDescription(at(row, 'description'));
    if (!description.ok) {
      preview.discarded.push({ row: rowNumber, reason: 'description_too_long' });
      continue;
    }
    const category = matchCategory(at(row, 'category'));
    if (!category.recognized) preview.remappedToOthers++;
    preview.valid.push({
      date,
      categoryId: category.id,
      amountCents,
      description: description.value,
    });
    months.add(monthKey(date));
  }

  if (preview.valid.length === 0 && preview.discarded.length === 0)
    throw new AppError('import_empty');

  preview.months = [...months].sort();
  const existing = new Set(existingMonths);
  preview.conflicts = preview.months.filter((m) => existing.has(m));
  return preview;
}

/** Junta as prévias de vários arquivos; o mesmo mês em dois arquivos é erro. */
export function mergePreviews(previews: readonly ImportPreview[]): ImportPreview {
  const seen = new Set<MonthKey>();
  for (const p of previews) {
    for (const m of p.months) {
      if (seen.has(m)) throw new AppError('import_duplicate_month');
      seen.add(m);
    }
  }
  return {
    valid: previews.flatMap((p) => p.valid),
    discarded: previews.flatMap((p) => p.discarded),
    blankRows: previews.reduce((a, p) => a + p.blankRows, 0),
    remappedToOthers: previews.reduce((a, p) => a + p.remappedToOthers, 0),
    months: [...seen].sort(),
    conflicts: [...new Set(previews.flatMap((p) => p.conflicts))].sort(),
  };
}

/** Agrupa os lançamentos válidos por mês, para substituir mês a mês. */
export function groupByMonth(valid: readonly ImportedExpense[]): Map<MonthKey, ImportedExpense[]> {
  const map = new Map<MonthKey, ImportedExpense[]>();
  for (const e of valid) {
    const m = monthKey(e.date);
    map.set(m, [...(map.get(m) ?? []), e]);
  }
  return map;
}

export const ROW_ERROR_LABEL: Record<ImportRowError, string> = {
  invalid_date: 'data inválida',
  invalid_amount: 'valor inválido',
  description_too_long: 'descrição com mais de 80 caracteres',
};

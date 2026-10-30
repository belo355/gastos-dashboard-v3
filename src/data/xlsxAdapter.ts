import { getCategory } from '../domain/categories';
import { EXPORT_HEADERS, MAX_IMPORT_BYTES } from '../domain/importRules';
import type { Expense } from '../domain/types';
import { AppError } from '../lib/errors';
import { log } from '../lib/log';

/** As bibliotecas de planilha só são baixadas quando o usuário importa ou exporta. */
const loadReader = () => import('read-excel-file/universal');
const loadWriter = () => import('write-excel-file/universal');

async function toArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Data local `YYYY-MM-DD` como Date em UTC (as planilhas não têm fuso). */
function utcDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

const HEADER_STYLE = { fontWeight: 'bold' as const };
const COLUMNS = [{ width: 12 }, { width: 40 }, { width: 16 }, { width: 14 }];

export const xlsxAdapter = {
  /** Lê a primeira aba como matriz de células; nunca envia o arquivo a lugar nenhum. */
  async parseWorkbook(file: Blob): Promise<unknown[][]> {
    if (file.size > MAX_IMPORT_BYTES) throw new AppError('import_too_large');
    try {
      const { readSheet } = await loadReader();
      const rows = await readSheet(await toArrayBuffer(file), 1);
      return rows as unknown[][];
    } catch (e) {
      log.warn('import.unreadable', { name: e instanceof Error ? e.name : 'unknown' });
      throw new AppError('import_unreadable', { cause: e });
    }
  },

  /** Um mês por arquivo: Data (célula de data), Descrição, Categoria, Valor (número #,##0.00), por data crescente. */
  async buildMonthWorkbook(expenses: readonly Expense[]): Promise<Blob> {
    try {
      const { default: writeXlsxFile } = await loadWriter();
      const sorted = [...expenses].sort(
        (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
      );
      const data = [
        EXPORT_HEADERS.map((value) => ({ value, ...HEADER_STYLE })),
        ...sorted.map((e) => [
          { value: utcDate(e.date), type: Date, format: 'dd/mm/yyyy' },
          e.description ? { value: e.description, type: String } : null,
          { value: getCategory(e.categoryId).name, type: String },
          { value: e.amountCents / 100, type: Number, format: '#,##0.00' },
        ]),
      ];
      return await writeXlsxFile(data, { sheet: 'Gastos', columns: COLUMNS }).toBlob();
    } catch (e) {
      log.error('export.failed', { name: e instanceof Error ? e.name : 'unknown' });
      throw new AppError('export_failed', { cause: e });
    }
  },

  /** Planilha modelo: cabeçalho e dois exemplos. */
  async buildTemplate(): Promise<Blob> {
    try {
      const { default: writeXlsxFile } = await loadWriter();
      const data = [
        EXPORT_HEADERS.map((value) => ({ value, ...HEADER_STYLE })),
        [
          { value: utcDate('2026-10-01'), type: Date, format: 'dd/mm/yyyy' },
          { value: 'Almoço', type: String },
          { value: 'Alimentação', type: String },
          { value: 25.9, type: Number, format: '#,##0.00' },
        ],
        [
          { value: utcDate('2026-10-02'), type: Date, format: 'dd/mm/yyyy' },
          { value: 'Compras da semana', type: String },
          { value: 'Mercado', type: String },
          { value: 184.37, type: Number, format: '#,##0.00' },
        ],
      ];
      return await writeXlsxFile(data, { sheet: 'Gastos', columns: COLUMNS }).toBlob();
    } catch (e) {
      throw new AppError('export_failed', { cause: e });
    }
  },
};

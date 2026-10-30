import { describe, expect, it } from 'vitest';
import { AppError } from '../lib/errors';
import { parseDateCell } from './dates';
import { groupByMonth, mergePreviews, normalizeRows } from './importRules';

const D = (s: string) => {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};

/** A planilha do CA-15: 20 linhas = 2 em branco + 1 data inválida + 17 válidas (1 categoria desconhecida). */
function ca15Rows(): unknown[][] {
  const header = ['Valor (R$)', 'Categoria', 'Data', 'Descrição'];
  const cats = [
    'Alimentação',
    'Mercado',
    'Transporte',
    'Pets',
    'Moradia',
    'carro',
    'SAÚDE',
    'Educação',
    'Lazer',
    'Jogos',
    'Vestuário',
    'Família',
    'Outros',
    'Alimentação',
    'Mercado',
    'Transporte',
    'Lazer',
  ];
  const rows: unknown[][] = cats.map((c, i) => [
    10 + i,
    c,
    D(`2026-10-${String(i + 1).padStart(2, '0')}`),
    `Item ${i + 1}`,
  ]);
  rows.splice(4, 0, [null, null, null, null]);
  rows.splice(10, 0, [10, 'Mercado', '31/02/2026', 'Data impossível']);
  rows.splice(15, 0, ['', '  ', null, '']);
  expect(rows).toHaveLength(20);
  return [header, ...rows];
}

describe('TU-11 — normalizeRows localiza colunas em qualquer ordem', () => {
  it('cabeçalhos Valor, Categoria, Data e Descrição com acento', () => {
    const p = normalizeRows([
      ['Valor', 'Categoria', 'Data', 'Descrição'],
      [25.9, 'Alimentação', D('2026-10-29'), 'Almoço'],
    ]);
    expect(p.valid).toEqual([
      { date: '2026-10-29', categoryId: 'alimentacao', amountCents: 2590, description: 'Almoço' },
    ]);
  });

  it('aceita "Descricao" sem acento, maiúsculas, espaços, "Valor (R$)" e colunas extras', () => {
    const p = normalizeRows([
      [null, ' DATA ', 'Observação', 'descricao', 'VALOR (R$)', 'categoria'],
      [null, '2026-10-29', 'ignorar', 'Táxi', 'R$ 1.234,56', 'transporte'],
    ]);
    expect(p.valid).toEqual([
      { date: '2026-10-29', categoryId: 'transporte', amountCents: 123456, description: 'Táxi' },
    ]);
  });

  it('sem coluna de descrição, a descrição fica null', () => {
    const p = normalizeRows([
      ['Data', 'Categoria', 'Valor'],
      ['29/10/2026', 'Lazer', '10'],
    ]);
    expect(p.valid[0]!.description).toBeNull();
  });
});

describe('TU-12 — normalizeRows com a planilha de 20 linhas do CA-15', () => {
  it('17 válidas, 1 em Outros, 1 descartada por data inválida, 2 em branco', () => {
    const p = normalizeRows(ca15Rows());
    expect(p.valid).toHaveLength(17);
    expect(p.remappedToOthers).toBe(1);
    expect(p.discarded).toEqual([{ row: 12, reason: 'invalid_date' }]);
    expect(p.blankRows).toBe(2);
    expect(p.months).toEqual(['2026-10']);
    expect(p.valid.filter((v) => v.categoryId === 'outros')).toHaveLength(2); // "Pets" remapeada + "Outros" explícita
  });

  it('valor inválido e descrição longa são descartados com motivo', () => {
    const p = normalizeRows([
      ['Data', 'Categoria', 'Valor', 'Descrição'],
      ['2026-10-01', 'Lazer', 0, null],
      ['2026-10-01', 'Lazer', 'abc', null],
      ['2026-10-01', 'Lazer', true, null],
      ['2026-10-01', 'Lazer', 5, 'x'.repeat(81)],
      ['2026-10-01', '', 5, 123],
    ]);
    expect(p.discarded.map((d) => d.reason)).toEqual([
      'invalid_amount',
      'invalid_amount',
      'invalid_amount',
      'description_too_long',
    ]);
    expect(p.valid).toEqual([
      { date: '2026-10-01', categoryId: 'outros', amountCents: 500, description: '123' },
    ]);
    expect(p.remappedToOthers).toBe(1);
  });
});

describe('TU-13 — normalizeRows sem colunas obrigatórias', () => {
  it('lança import_missing_columns listando as ausentes', () => {
    try {
      normalizeRows([
        ['Data', 'Descrição'],
        ['2026-10-01', 'x'],
      ]);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('import_missing_columns');
      expect((e as AppError).details).toEqual(['Categoria', 'Valor']);
      expect((e as AppError).message).toBe('A planilha não tem as colunas: Categoria, Valor.');
    }
  });

  it('planilha vazia ou só com cabeçalho → import_empty; grande demais → import_too_large', () => {
    expect(() => normalizeRows([])).toThrowError(expect.objectContaining({ code: 'import_empty' }));
    expect(() =>
      normalizeRows([
        ['Data', 'Categoria', 'Valor'],
        [null, null, null],
      ]),
    ).toThrowError(expect.objectContaining({ code: 'import_empty' }));
    const big = [
      ['Data', 'Categoria', 'Valor'],
      ...Array.from({ length: 10_001 }, () => ['2026-10-01', 'Lazer', 1]),
    ];
    expect(() => normalizeRows(big)).toThrowError(
      expect.objectContaining({ code: 'import_too_large' }),
    );
  });
});

describe('TU-14 — normalizeRows detecta conflitos de mês', () => {
  it("com existingMonths = ['2026-10'], conflicts = ['2026-10']", () => {
    const rows = [
      ['Data', 'Categoria', 'Valor'],
      ['2026-10-05', 'Lazer', 10],
      ['2026-09-05', 'Lazer', 10],
    ];
    const p = normalizeRows(rows, ['2026-10', '2026-08']);
    expect(p.months).toEqual(['2026-09', '2026-10']);
    expect(p.conflicts).toEqual(['2026-10']);
    expect(normalizeRows(rows, []).conflicts).toEqual([]);
  });

  it('dois arquivos do mesmo mês → import_duplicate_month; meses distintos se juntam', () => {
    const a = normalizeRows([
      ['Data', 'Categoria', 'Valor'],
      ['2026-10-05', 'Lazer', 10],
    ]);
    const b = normalizeRows([
      ['Data', 'Categoria', 'Valor'],
      ['2026-10-09', 'Lazer', 10],
    ]);
    const c = normalizeRows(
      [
        ['Data', 'Categoria', 'Valor'],
        ['2026-09-09', 'Lazer', 10],
      ],
      ['2026-09'],
    );
    expect(() => mergePreviews([a, b])).toThrowError(
      expect.objectContaining({ code: 'import_duplicate_month' }),
    );
    const merged = mergePreviews([a, c]);
    expect(merged.months).toEqual(['2026-09', '2026-10']);
    expect(merged.conflicts).toEqual(['2026-09']);
    expect(merged.valid).toHaveLength(2);
    expect([...groupByMonth(merged.valid).keys()].sort()).toEqual(['2026-09', '2026-10']);
  });
});

describe('TU-15 — Conversão de datas do Excel', () => {
  it('serial, dd/mm/aaaa e aaaa-mm-dd aceitos; 31/02/2026 inválida', () => {
    expect(parseDateCell(46324)).toBe('2026-10-29');
    expect(parseDateCell('29/10/2026')).toBe('2026-10-29');
    expect(parseDateCell('2026-10-29')).toBe('2026-10-29');
    expect(parseDateCell(D('2026-10-29'))).toBe('2026-10-29');
    expect(parseDateCell('31/02/2026')).toBeNull();
    const p = normalizeRows([
      ['Data', 'Categoria', 'Valor'],
      ['31/02/2026', 'Lazer', 10],
      [46324, 'Lazer', 10],
    ]);
    expect(p.discarded).toEqual([{ row: 2, reason: 'invalid_date' }]);
    expect(p.valid[0]!.date).toBe('2026-10-29');
  });
});

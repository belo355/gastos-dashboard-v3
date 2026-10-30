import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeRows } from '../domain/importRules';
import { summarizeMonth } from '../domain/summary';
import { makeExpenseInput, resetDb } from '../test/factories';
import { expenseRepository as repo } from './expenseRepository';
import { xlsxAdapter } from './xlsxAdapter';

beforeEach(resetDb);

function fixture(name: string): Blob {
  const buf = readFileSync(resolve(__dirname, '../../tests/fixtures', name));
  return new Blob([buf]);
}

describe('TI-06 — replaceMonths substitui atomicamente', () => {
  it('meses em conflito são substituídos e os demais meses ficam intactos', async () => {
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-05', amountCents: 1000 }));
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-06', amountCents: 2000 }));
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-09-06', amountCents: 3000 }));
    await repo.create(makeExpenseInput({ walletId: 'w2', date: '2026-10-06', amountCents: 4000 }));

    await repo.replaceMonths(
      'w1',
      new Map([
        [
          '2026-10',
          [{ date: '2026-10-20', categoryId: 'lazer', amountCents: 9900, description: 'Show' }],
        ],
        [
          '2026-11',
          [{ date: '2026-11-01', categoryId: 'mercado', amountCents: 100, description: null }],
        ],
      ]),
    );

    const oct = await repo.listByMonth('w1', '2026-10');
    expect(oct.map((e) => [e.date, e.amountCents, e.description])).toEqual([
      ['2026-10-20', 9900, 'Show'],
    ]);
    expect(await repo.listByMonth('w1', '2026-11')).toHaveLength(1);
    expect(await repo.listByMonth('w1', '2026-09')).toHaveLength(1);
    expect(await repo.listByMonth('w2', '2026-10')).toHaveLength(1);
  });

  it('se uma inserção falhar no meio, a transação é revertida', async () => {
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-05', amountCents: 1000 }));
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-09-05', amountCents: 2000 }));

    // O 1º mês é apagado e reinserido; o 2º falha na validação: tudo deve voltar ao estado original.
    const bad = repo.replaceMonths(
      'w1',
      new Map([
        [
          '2026-09',
          [{ date: '2026-09-10', categoryId: 'lazer', amountCents: 500, description: null }],
        ],
        [
          '2026-10',
          [{ date: '2026-10-10', categoryId: 'lazer', amountCents: 0, description: null }],
        ], // inválido
      ]),
    );
    await expect(bad).rejects.toMatchObject({ code: 'invalid_input' });

    expect((await repo.listByMonth('w1', '2026-09')).map((e) => e.amountCents)).toEqual([2000]);
    expect((await repo.listByMonth('w1', '2026-10')).map((e) => e.amountCents)).toEqual([1000]);
  });

  it('um lançamento fora do mês declarado também reverte tudo', async () => {
    await repo.create(makeExpenseInput({ walletId: 'w1', date: '2026-10-05', amountCents: 1000 }));
    await expect(
      repo.replaceMonths(
        'w1',
        new Map([
          [
            '2026-10',
            [{ date: '2026-11-10', categoryId: 'lazer', amountCents: 500, description: null }],
          ],
        ]),
      ),
    ).rejects.toMatchObject({ code: 'invalid_input' });
    expect(await repo.listByMonth('w1', '2026-10')).toHaveLength(1);
  });
});

describe('TI-07 — Exportar e reimportar preserva os dados (ida e volta)', () => {
  it('buildMonthWorkbook → parseWorkbook → normalizeRows reproduz os lançamentos', async () => {
    const inputs = [
      makeExpenseInput({
        walletId: 'w1',
        date: '2026-10-31',
        categoryId: 'saude',
        amountCents: 8990,
        description: 'Farmácia',
      }),
      makeExpenseInput({
        walletId: 'w1',
        date: '2026-10-01',
        categoryId: 'alimentacao',
        amountCents: 2590,
        description: 'Almoço',
      }),
      makeExpenseInput({
        walletId: 'w1',
        date: '2026-10-15',
        categoryId: 'vestuario',
        amountCents: 123456,
        description: null,
      }),
      makeExpenseInput({
        walletId: 'w1',
        date: '2026-10-15',
        categoryId: 'outros',
        amountCents: 1,
        description: 'Ação "especial" & <teste>',
      }),
    ];
    for (const i of inputs) await repo.create(i);
    const expenses = await repo.listByMonth('w1', '2026-10');

    const blob = await xlsxAdapter.buildMonthWorkbook(expenses);
    const rows = await xlsxAdapter.parseWorkbook(blob);
    expect(rows[0]).toEqual(['Data', 'Descrição', 'Categoria', 'Valor']);
    const preview = normalizeRows(rows);

    const key = (e: {
      date: string;
      categoryId: string;
      amountCents: number;
      description: string | null;
    }) => `${e.date}|${e.categoryId}|${e.amountCents}|${e.description}`;
    expect(preview.valid.map(key).sort()).toEqual(expenses.map(key).sort());
    expect(preview.valid.map((v) => v.date)).toEqual([
      '2026-10-01',
      '2026-10-15',
      '2026-10-15',
      '2026-10-31',
    ]);
    expect(preview.discarded).toEqual([]);
    expect(summarizeMonth(preview.valid).totalCents).toBe(summarizeMonth(expenses).totalCents);
  });

  it('a planilha modelo é reconhecida pela importação', async () => {
    const preview = normalizeRows(
      await xlsxAdapter.parseWorkbook(await xlsxAdapter.buildTemplate()),
    );
    expect(preview.valid).toHaveLength(2);
    expect(preview.discarded).toEqual([]);
  });
});

describe('xlsxAdapter com as fixtures', () => {
  it('ca15-20-linhas.xlsx → 17 válidas, 1 em Outros, 1 descartada', async () => {
    const p = normalizeRows(await xlsxAdapter.parseWorkbook(fixture('ca15-20-linhas.xlsx')));
    expect(p.valid).toHaveLength(17);
    expect(p.remappedToOthers).toBe(1);
    expect(p.discarded).toEqual([{ row: 12, reason: 'invalid_date' }]);
    expect(p.blankRows).toBe(2);
  });

  it('sem-colunas.xlsx → import_missing_columns', async () => {
    const rows = await xlsxAdapter.parseWorkbook(fixture('sem-colunas.xlsx'));
    expect(() => normalizeRows(rows)).toThrowError(
      expect.objectContaining({ code: 'import_missing_columns' }),
    );
  });

  it('corrompido.xlsx → import_unreadable; arquivo > 5 MB → import_too_large', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(xlsxAdapter.parseWorkbook(fixture('corrompido.xlsx'))).rejects.toMatchObject({
      code: 'import_unreadable',
    });
    const big = { size: 6 * 1024 * 1024 } as Blob;
    await expect(xlsxAdapter.parseWorkbook(big)).rejects.toMatchObject({
      code: 'import_too_large',
    });
  });
});

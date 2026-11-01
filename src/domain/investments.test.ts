import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  annualRate,
  buildPortfolio,
  formatRate,
  lastMonths,
  parseRateValue,
  shortMonth,
  validateEntryInput,
  validateInvestmentInput,
  valuationsAt,
  type EntryKind,
  type Investment,
  type InvestmentEntry,
} from './investments';

const REFS = { cdi: 10, ipca: 4 };

let seq = 0;
function entry(
  investmentId: string,
  date: string,
  kind: EntryKind,
  amountCents: number,
): InvestmentEntry {
  seq += 1;
  return {
    id: `e${seq}`,
    investmentId,
    date,
    month: date.slice(0, 7),
    kind,
    amountCents,
    note: null,
    createdAt: `2026-01-01T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
  };
}

function inv(id: string, over: Partial<Investment> = {}): Investment {
  return {
    id,
    name: id,
    type: 'renda-fixa',
    rate: null,
    maturity: null,
    isSample: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('taxas', () => {
  it('converte cada tipo de taxa em taxa anual', () => {
    expect(annualRate(null, REFS)).toBe(0);
    expect(annualRate({ kind: 'pre', value: 12 }, REFS)).toBeCloseTo(0.12);
    expect(annualRate({ kind: 'cdi', value: 110 }, REFS)).toBeCloseTo(0.11);
    expect(annualRate({ kind: 'ipca', value: 6 }, REFS)).toBeCloseTo(1.04 * 1.06 - 1);
  });

  it('formata e lê taxas em pt-BR', () => {
    expect(formatRate({ kind: 'cdi', value: 110 })).toBe('110% do CDI');
    expect(formatRate({ kind: 'pre', value: 12.5 })).toBe('12,5% a.a.');
    expect(formatRate({ kind: 'ipca', value: 6 })).toBe('IPCA + 6% a.a.');
    expect(parseRateValue('12,5')).toBe(12.5);
    expect(parseRateValue('110%')).toBe(110);
    expect(parseRateValue('abc')).toBeNull();
    expect(parseRateValue('')).toBeNull();
  });
});

describe('valuationsAt', () => {
  it('sem taxa: valor = aportes − resgates; saldo informado substitui o valor', () => {
    const list = [
      entry('a', '2026-01-10', 'aporte', 100_00),
      entry('a', '2026-02-10', 'aporte', 50_00),
      entry('a', '2026-03-31', 'saldo', 180_00),
    ];
    const [jan, feb, mar] = valuationsAt(list, 0, ['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(jan).toEqual({ valueCents: 100_00, appliedCents: 100_00 });
    expect(feb).toEqual({ valueCents: 150_00, appliedCents: 150_00 });
    expect(mar).toEqual({ valueCents: 180_00, appliedCents: 150_00 });
  });

  it('com taxa: rende por dias corridos a partir do último evento', () => {
    const list = [entry('a', '2025-01-01', 'aporte', 1000_00)];
    const [v] = valuationsAt(list, 0.1, ['2026-01-01']);
    expect(v!.valueCents).toBe(1100_00);
    expect(v!.appliedCents).toBe(1000_00);
  });

  it('no mesmo dia vale a ordem de lançamento', () => {
    // Saldo informado e, depois, um aporte: o aporte soma ao saldo.
    const after = [
      entry('a', '2026-01-10', 'saldo', 500_00),
      entry('a', '2026-01-10', 'aporte', 400_00),
    ];
    expect(valuationsAt(after, 0, ['2026-01-10'])[0]!.valueCents).toBe(900_00);
    // Aporte e, depois, o saldo do dia: o saldo já inclui o aporte.
    const before = [
      entry('a', '2026-01-10', 'aporte', 400_00),
      entry('a', '2026-01-10', 'saldo', 500_00),
    ];
    expect(valuationsAt(before, 0, ['2026-01-10'])[0]!.valueCents).toBe(500_00);
    // Mesmo instante: o saldo fica por último.
    const tie = [
      { ...entry('a', '2026-01-10', 'saldo', 500_00), createdAt: 'x' },
      { ...entry('a', '2026-01-10', 'aporte', 400_00), createdAt: 'x' },
    ];
    expect(valuationsAt(tie, 0, ['2026-01-10'])[0]!.valueCents).toBe(500_00);
  });

  it('resgate reduz o aplicado na proporção do valor resgatado', () => {
    const list = [
      entry('a', '2026-01-01', 'aporte', 100_00),
      entry('a', '2026-02-01', 'saldo', 200_00),
      entry('a', '2026-02-02', 'resgate', 100_00),
    ];
    const [v] = valuationsAt(list, 0, ['2026-02-28']);
    expect(v).toEqual({ valueCents: 100_00, appliedCents: 50_00 });
  });

  it('antes da primeira movimentação o valor é zero', () => {
    const list = [entry('a', '2026-05-01', 'aporte', 100_00)];
    expect(valuationsAt(list, 0.1, ['2026-04-30'])[0]).toEqual({ valueCents: 0, appliedCents: 0 });
  });

  it('pedir várias datas dá o mesmo que pedir cada uma sozinha', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            day: fc.integer({ min: 0, max: 700 }),
            kind: fc.constantFrom<EntryKind>('aporte', 'resgate', 'saldo'),
            amount: fc.integer({ min: 1, max: 1_000_000_00 }),
          }),
          { maxLength: 15 },
        ),
        fc.double({ min: 0, max: 0.3, noNaN: true }),
        (raw, annual) => {
          const toDate = (d: number) =>
            new Date(Date.UTC(2025, 0, 1 + d)).toISOString().slice(0, 10);
          const list = raw.map((r) => entry('a', toDate(r.day), r.kind, r.amount));
          const dates = [100, 300, 500, 720].map(toDate);
          const together = valuationsAt(list, annual, dates);
          dates.forEach((d, k) => {
            const alone = valuationsAt(list, annual, [d])[0]!;
            expect(Math.abs(alone.valueCents - together[k]!.valueCents)).toBeLessThanOrEqual(1);
            expect(alone.appliedCents).toBe(together[k]!.appliedCents);
          });
          for (const v of together) {
            expect(v.valueCents).toBeGreaterThanOrEqual(0);
            expect(v.appliedCents).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });
});

describe('buildPortfolio', () => {
  const investments = [inv('cdb'), inv('acao', { type: 'acoes' })];
  const entries = [
    entry('cdb', '2026-01-15', 'aporte', 1000_00),
    entry('cdb', '2026-03-31', 'saldo', 1100_00),
    entry('acao', '2026-02-10', 'aporte', 500_00),
    entry('acao', '2026-03-20', 'saldo', 400_00),
  ];

  it('histórico mês a mês com aplicado e ganho (patrimônio − aplicado)', () => {
    const p = buildPortfolio(investments, entries, REFS, '2026-04-15');
    expect(p.history.map((h) => h.month)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
    expect(p.history[0]).toMatchObject({
      valueCents: 1000_00,
      appliedCents: 1000_00,
      gainCents: 0,
    });
    expect(p.history[1]).toMatchObject({ valueCents: 1500_00, appliedCents: 1500_00 });
    expect(p.history[2]).toMatchObject({
      date: '2026-03-31',
      valueCents: 1500_00,
      appliedCents: 1500_00,
      gainCents: 0,
    });
    // O mês corrente usa a data de referência.
    expect(p.history[3]!.date).toBe('2026-04-15');
    for (const h of p.history) expect(h.gainCents).toBe(h.valueCents - h.appliedCents);
  });

  it('totais, participação e agrupamento por tipo', () => {
    const p = buildPortfolio(investments, entries, REFS, '2026-04-15');
    expect(p.totals).toEqual({
      valueCents: 1500_00,
      appliedCents: 1500_00,
      gainCents: 0,
      returnPercent: 0,
    });
    const cdb = p.positions.find((x) => x.investment.id === 'cdb')!;
    expect(cdb.gainCents).toBe(100_00);
    expect(cdb.returnPercent).toBeCloseTo(10);
    expect(cdb.lastBalanceDate).toBe('2026-03-31');
    expect(p.positions.reduce((a, x) => a + x.sharePercent, 0)).toBeCloseTo(100);
    expect(p.byType.map((t) => t.type)).toEqual(['renda-fixa', 'acoes']);
    expect(p.byType[1]!.gainCents).toBe(-100_00);
  });

  it('marca como estimado o valor que vem da taxa', () => {
    const withRate = [inv('cdb', { rate: { kind: 'cdi', value: 100 } })];
    const p = buildPortfolio(
      withRate,
      [entry('cdb', '2026-01-01', 'aporte', 1000_00)],
      REFS,
      '2026-07-01',
    );
    expect(p.positions[0]!.estimated).toBe(true);
    expect(p.positions[0]!.valueCents).toBeGreaterThan(1000_00);
  });

  it('carteira vazia', () => {
    const p = buildPortfolio([], [], REFS, '2026-04-15');
    expect(p.history).toEqual([]);
    expect(p.totals.returnPercent).toBeNull();
  });

  it('recorte e rótulo de meses', () => {
    const p = buildPortfolio(investments, entries, REFS, '2026-04-15');
    expect(lastMonths(p.history, 2).map((h) => h.month)).toEqual(['2026-03', '2026-04']);
    expect(lastMonths(p.history, null)).toHaveLength(4);
    expect(shortMonth('2026-05')).toBe('05/26');
  });
});

describe('validação', () => {
  it('investimento: nome, tipo e faixa da taxa', () => {
    expect(validateInvestmentInput({ name: '  CDB  Nubank ', type: 'renda-fixa' })).toEqual({
      ok: true,
      value: { name: 'CDB Nubank', type: 'renda-fixa', rate: null, maturity: null },
    });
    const bad = validateInvestmentInput({ name: '', rate: { kind: 'cdi', value: 0 } });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.name).toBe('Informe o nome do investimento');
      expect(bad.errors.type).toBe('Escolha o tipo');
      expect(bad.errors.rate).toMatch(/CDI/);
    }
  });

  it('movimentação: valor, data e investimento', () => {
    const ok = validateEntryInput({
      investmentId: 'x',
      date: '2026-01-01',
      kind: 'aporte',
      amountCents: 100,
      note: '  ',
    });
    expect(ok).toEqual({
      ok: true,
      value: {
        investmentId: 'x',
        date: '2026-01-01',
        kind: 'aporte',
        amountCents: 100,
        note: null,
      },
    });
    const bad = validateEntryInput({
      investmentId: '',
      date: '2999-01-01',
      kind: 'aporte',
      amountCents: 0,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.amountCents).toBe('Informe o valor');
      expect(bad.errors.date).toBe('A data não pode estar no futuro');
      expect(bad.errors.investmentId).toBe('Escolha o investimento');
    }
  });
});

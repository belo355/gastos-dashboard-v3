import { addMonths, currentMonth, lastDayOfMonth, today } from '../domain/dates';
import type { Investment, InvestmentEntry, InvestmentTypeId, Rate } from '../domain/investments';
import type { DateString } from '../domain/types';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import { guard } from './storageGuard';

interface SampleSpec {
  name: string;
  type: InvestmentTypeId;
  rate: Rate | null;
  maturity: DateString | null;
  initialCents: number;
  /** Aporte mensal (0 = sem aportes) e a cada quantos meses. */
  monthlyCents: number;
  every: number;
  /** Variação mensal de mercado (só ativos sem taxa): base + amplitude·sen(k·freq). */
  drift?: [base: number, amplitude: number, freq: number];
}

const SPECS: SampleSpec[] = [
  {
    name: 'Tesouro IPCA+ 2035',
    type: 'tesouro',
    rate: { kind: 'ipca', value: 6.5 },
    maturity: '2035-05-15',
    initialCents: 38_000_00,
    monthlyCents: 2_000_00,
    every: 3,
  },
  {
    name: 'Tesouro Selic 2029',
    type: 'tesouro',
    rate: { kind: 'cdi', value: 100 },
    maturity: '2029-03-01',
    initialCents: 22_000_00,
    monthlyCents: 0,
    every: 1,
  },
  {
    name: 'CDB Banco Digital',
    type: 'renda-fixa',
    rate: { kind: 'cdi', value: 110 },
    maturity: null,
    initialCents: 8_000_00,
    monthlyCents: 1_000_00,
    every: 1,
  },
  {
    name: 'LCI 2027',
    type: 'renda-fixa',
    rate: { kind: 'pre', value: 11.8 },
    maturity: '2027-08-20',
    initialCents: 10_000_00,
    monthlyCents: 0,
    every: 1,
  },
  {
    name: 'ETF Ibovespa',
    type: 'acoes',
    rate: null,
    maturity: null,
    initialCents: 9_000_00,
    monthlyCents: 600_00,
    every: 1,
    drift: [0.009, 0.035, 1.3],
  },
  {
    name: 'FII Logística',
    type: 'fiis',
    rate: null,
    maturity: null,
    initialCents: 6_000_00,
    monthlyCents: 400_00,
    every: 2,
    drift: [0.006, 0.02, 0.9],
  },
  {
    name: 'Bitcoin',
    type: 'cripto',
    rate: null,
    maturity: null,
    initialCents: 2_500_00,
    monthlyCents: 0,
    every: 1,
    drift: [0.02, 0.12, 2.1],
  },
];

/** Meses de histórico do exemplo (inclui o mês corrente). */
const MONTHS = 14;

/**
 * Cria investimentos fictícios com ~14 meses de aportes e saldos, marcados como exemplo.
 * Os ativos com taxa só têm aportes (o valor é projetado); os de mercado têm saldo mensal.
 */
export async function createSampleInvestments(reference: DateString = today()): Promise<void> {
  const now = nowIso();
  const start = addMonths(currentMonth(), -(MONTHS - 1));
  const investments: Investment[] = [];
  const entries: InvestmentEntry[] = [];
  let order = 0;
  const add = (
    investmentId: string,
    date: DateString,
    kind: InvestmentEntry['kind'],
    cents: number,
  ) => {
    if (date > reference) return;
    entries.push({
      id: newId(),
      investmentId,
      date,
      month: date.slice(0, 7),
      kind,
      amountCents: Math.round(cents),
      note: null,
      // createdAt crescente: mantém a ordem estável no mesmo dia.
      createdAt: new Date(Date.parse(now) + order++).toISOString(),
    });
  };

  for (const spec of SPECS) {
    const id = newId();
    investments.push({
      id,
      name: spec.name,
      type: spec.type,
      rate: spec.rate,
      maturity: spec.maturity,
      isSample: true,
      createdAt: now,
      updatedAt: now,
    });
    let market = spec.initialCents;
    for (let k = 0; k < MONTHS; k++) {
      const month = addMonths(start, k);
      const aporteDay = `${month}-05`;
      const amount = k === 0 ? spec.initialCents : k % spec.every === 0 ? spec.monthlyCents : 0;
      if (amount > 0) add(id, aporteDay, 'aporte', amount);
      if (spec.drift && aporteDay <= reference) {
        if (k > 0) market += amount;
        const [base, amp, freq] = spec.drift;
        market *= 1 + base + amp * Math.sin((k + 1) * freq);
        const end = lastDayOfMonth(month);
        add(id, end <= reference ? end : reference, 'saldo', market);
      }
    }
  }

  await guard('investments.sample', () =>
    db.transaction('rw', db.investments, db.investmentEntries, async () => {
      await db.investments.bulkAdd(investments);
      await db.investmentEntries.bulkAdd(entries);
    }),
  );
}

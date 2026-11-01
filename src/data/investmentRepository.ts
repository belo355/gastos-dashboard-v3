import { monthKey } from '../domain/dates';
import {
  DEFAULT_MARKET_REFS,
  validateEntryInput,
  validateInvestmentInput,
  type EntryInput,
  type Investment,
  type InvestmentEntry,
  type InvestmentInput,
  type MarketRefs,
} from '../domain/investments';
import { AppError } from '../lib/errors';
import { newId, nowIso } from '../lib/id';
import { db } from './db';
import { guard } from './storageGuard';

function validInvestment(input: InvestmentInput): InvestmentInput {
  const r = validateInvestmentInput(input);
  if (!r.ok) throw new AppError('invalid_input', { details: Object.values(r.errors) as string[] });
  return r.value;
}

function validEntry(input: EntryInput): EntryInput {
  const r = validateEntryInput(input);
  if (!r.ok) throw new AppError('invalid_input', { details: Object.values(r.errors) as string[] });
  return r.value;
}

function toEntry(input: EntryInput, id: string, createdAt: string): InvestmentEntry {
  return {
    id,
    investmentId: input.investmentId,
    date: input.date,
    month: monthKey(input.date),
    kind: input.kind,
    amountCents: input.amountCents,
    note: input.note ?? null,
    createdAt,
  };
}

/** Cadastro de um investimento que já existe: quanto foi aplicado, quando e quanto vale hoje. */
export interface ExistingPosition {
  appliedCents: number;
  appliedOn: string;
  /** Saldo atual informado (opcional): vira um "saldo informado" na data `balanceOn`. */
  balanceCents: number | null;
  balanceOn: string;
}

export const investmentRepository = {
  /** Cria o investimento e as movimentações iniciais numa transação só. */
  async create(input: InvestmentInput, start: ExistingPosition, isSample = false) {
    const value = validInvestment(input);
    const now = nowIso();
    const investment: Investment = {
      id: newId(),
      ...value,
      isSample,
      createdAt: now,
      updatedAt: now,
    };
    const entries = [
      toEntry(
        validEntry({
          investmentId: investment.id,
          date: start.appliedOn,
          kind: 'aporte',
          amountCents: start.appliedCents,
          note: null,
        }),
        newId(),
        now,
      ),
    ];
    if (start.balanceCents !== null && start.balanceCents !== start.appliedCents) {
      entries.push(
        toEntry(
          validEntry({
            investmentId: investment.id,
            date: start.balanceOn,
            kind: 'saldo',
            amountCents: start.balanceCents,
            note: null,
          }),
          newId(),
          now,
        ),
      );
    }
    return guard('investments.create', () =>
      db.transaction('rw', db.investments, db.investmentEntries, async () => {
        await db.investments.add(investment);
        await db.investmentEntries.bulkAdd(entries);
        return investment;
      }),
    );
  },

  async update(id: string, input: InvestmentInput): Promise<void> {
    const value = validInvestment(input);
    return guard('investments.update', () =>
      db.transaction('rw', db.investments, async () => {
        const current = await db.investments.get(id);
        if (!current) throw new AppError('not_found');
        await db.investments.put({ ...current, ...value, updatedAt: nowIso() });
      }),
    );
  },

  /** Exclui o investimento e todas as movimentações dele. */
  remove(id: string): Promise<void> {
    return guard('investments.remove', () =>
      db.transaction('rw', db.investments, db.investmentEntries, async () => {
        await db.investmentEntries.where('investmentId').equals(id).delete();
        await db.investments.delete(id);
      }),
    );
  },

  async addEntry(input: EntryInput): Promise<InvestmentEntry> {
    const value = validEntry(input);
    return guard('investments.addEntry', () =>
      db.transaction('rw', db.investments, db.investmentEntries, async () => {
        if (!(await db.investments.get(value.investmentId))) throw new AppError('not_found');
        const record = toEntry(value, newId(), nowIso());
        await db.investmentEntries.add(record);
        return record;
      }),
    );
  },

  async updateEntry(id: string, input: EntryInput): Promise<void> {
    const value = validEntry(input);
    return guard('investments.updateEntry', () =>
      db.transaction('rw', db.investmentEntries, async () => {
        const current = await db.investmentEntries.get(id);
        if (!current) throw new AppError('not_found');
        await db.investmentEntries.put(toEntry(value, id, current.createdAt));
      }),
    );
  },

  removeEntry(id: string): Promise<void> {
    return guard('investments.removeEntry', () => db.investmentEntries.delete(id));
  },

  /** Apaga só os investimentos de exemplo (e as movimentações deles). */
  removeSamples(): Promise<void> {
    return guard('investments.removeSamples', () =>
      db.transaction('rw', db.investments, db.investmentEntries, async () => {
        const ids = (await db.investments.toArray()).filter((i) => i.isSample).map((i) => i.id);
        await db.investmentEntries.where('investmentId').anyOf(ids).delete();
        await db.investments.bulkDelete(ids);
      }),
    );
  },

  async getRefs(): Promise<MarketRefs> {
    const r = await guard('investments.getRefs', () => db.marketRefs.get('refs'));
    return r ? { cdi: r.cdi, ipca: r.ipca } : DEFAULT_MARKET_REFS;
  },

  setRefs(refs: MarketRefs): Promise<void> {
    if (![refs.cdi, refs.ipca].every((v) => Number.isFinite(v) && v >= -10 && v <= 100)) {
      return Promise.reject(new AppError('invalid_input'));
    }
    return guard('investments.setRefs', async () => {
      await db.marketRefs.put({ id: 'refs', cdi: refs.cdi, ipca: refs.ipca });
    });
  },
};

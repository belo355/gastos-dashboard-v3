import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { today } from '../domain/dates';
import {
  buildPortfolio,
  DEFAULT_MARKET_REFS,
  type Investment,
  type InvestmentEntry,
  type MarketRefs,
  type Portfolio,
} from '../domain/investments';

export interface InvestmentsData {
  investments: Investment[];
  entries: InvestmentEntry[];
  refs: MarketRefs;
  portfolio: Portfolio;
  hasSample: boolean;
}

/** Investimentos, movimentações e a carteira calculada; reage a qualquer gravação. */
export function useInvestments(): InvestmentsData | undefined {
  return useLiveQuery(async () => {
    const [investments, entries, refsRecord] = await Promise.all([
      db.investments.toArray(),
      db.investmentEntries.toArray(),
      db.marketRefs.get('refs'),
    ]);
    const refs = refsRecord ? { cdi: refsRecord.cdi, ipca: refsRecord.ipca } : DEFAULT_MARKET_REFS;
    return {
      investments,
      entries,
      refs,
      portfolio: buildPortfolio(investments, entries, refs, today()),
      hasSample: investments.some((i) => i.isSample),
    };
  }, []);
}

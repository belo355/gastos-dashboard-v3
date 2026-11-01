import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Route, Routes, useMatch } from 'react-router';
import type { EntryKind, Investment, InvestmentEntry } from '../../domain/investments';
import { INVESTMENT_LAUNCH_EVENT, InvestmentActionsContext } from './InvestmentActions';
import { useInvestments, type InvestmentsData } from '../../hooks/useInvestments';
import { AssetDetail } from './AssetDetail';
import { EntryFormSheet, type EntryFormState } from './EntryFormSheet';
import { InvestmentFormSheet } from './InvestmentFormSheet';
import { InvestmentsDashboard } from './InvestmentsDashboard';
import { RatesSheet } from './RatesSheet';

/**
 * Aba Investimentos: painel (patrimônio, evolução, distribuição, ativos e extrato) e o detalhe
 * de cada ativo. Os formulários ficam aqui, abertos por qualquer parte da aba; o botão "Lançar"
 * da barra chega pelo evento INVESTMENT_LAUNCH_EVENT.
 */
export function InvestmentsPage() {
  const data = useInvestments();
  const [assetForm, setAssetForm] = useState<{ open: boolean; investment?: Investment }>({
    open: false,
  });
  const [entryForm, setEntryForm] = useState<EntryFormState>({ open: false });
  const [ratesOpen, setRatesOpen] = useState(false);
  const detail = useMatch('/investimentos/:id');
  const detailId = detail?.params.id;

  const newInvestment = useCallback(() => setAssetForm({ open: true }), []);
  const editInvestment = useCallback(
    (investment: Investment) => setAssetForm({ open: true, investment }),
    [],
  );
  const newEntry = useCallback(
    (opts?: { investmentId?: string; kind?: EntryKind }) => setEntryForm({ open: true, ...opts }),
    [],
  );
  const editEntry = useCallback(
    (entry: InvestmentEntry) => setEntryForm({ open: true, entry }),
    [],
  );
  const openRates = useCallback(() => setRatesOpen(true), []);
  const actions = useMemo(
    () => ({ newInvestment, editInvestment, newEntry, editEntry, openRates }),
    [newInvestment, editInvestment, newEntry, editEntry, openRates],
  );

  // "Lançar" na barra: sem investimentos, cadastra o primeiro; senão, lança uma movimentação
  // (no detalhe de um ativo, já com ele escolhido).
  const latest = useRef({ data, detailId });
  useEffect(() => {
    latest.current = { data, detailId };
  });
  useEffect(() => {
    const onLaunch = () => {
      const { data: d, detailId: id } = latest.current;
      if (!d) return;
      if (d.investments.length === 0) newInvestment();
      else
        newEntry(id && d.investments.some((i) => i.id === id) ? { investmentId: id } : undefined);
    };
    window.addEventListener(INVESTMENT_LAUNCH_EVENT, onLaunch);
    return () => window.removeEventListener(INVESTMENT_LAUNCH_EVENT, onLaunch);
  }, [newInvestment, newEntry]);

  return (
    <InvestmentActionsContext.Provider value={actions}>
      {!data ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <Routes>
          <Route index element={<InvestmentsDashboard data={data} />} />
          <Route path=":id" element={<AssetDetail data={data} />} />
          <Route path="*" element={<InvestmentsDashboard data={data} />} />
        </Routes>
      )}
      {data && (
        <Sheets
          data={data}
          assetForm={assetForm}
          entryForm={entryForm}
          ratesOpen={ratesOpen}
          closeAsset={() => setAssetForm({ open: false })}
          closeEntry={() => setEntryForm({ open: false })}
          closeRates={() => setRatesOpen(false)}
        />
      )}
    </InvestmentActionsContext.Provider>
  );
}

function Sheets({
  data,
  assetForm,
  entryForm,
  ratesOpen,
  closeAsset,
  closeEntry,
  closeRates,
}: {
  data: InvestmentsData;
  assetForm: { open: boolean; investment?: Investment };
  entryForm: EntryFormState;
  ratesOpen: boolean;
  closeAsset: () => void;
  closeEntry: () => void;
  closeRates: () => void;
}): ReactNode {
  return (
    <>
      <InvestmentFormSheet
        open={assetForm.open}
        investment={assetForm.investment}
        onClose={closeAsset}
      />
      <EntryFormSheet
        state={entryForm}
        investments={data.investments}
        positions={data.portfolio.positions}
        onClose={closeEntry}
      />
      <RatesSheet open={ratesOpen} refs={data.refs} onClose={closeRates} />
    </>
  );
}

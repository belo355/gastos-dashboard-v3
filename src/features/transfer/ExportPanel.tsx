import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download } from 'lucide-react';
import { db } from '../../data/db';
import { expenseRepository } from '../../data/expenseRepository';
import { settingsRepository } from '../../data/settingsRepository';
import { xlsxAdapter } from '../../data/xlsxAdapter';
import { formatMonthLabel } from '../../domain/dates';
import { formatMoney } from '../../domain/money';
import { walletSlug } from '../../domain/walletName';
import type { MonthKey } from '../../domain/types';
import { useActiveWallet } from '../../hooks/useActiveWallet';
import { saveFile } from '../../lib/download';
import { errorMessage } from '../../lib/errors';
import { nowIso } from '../../lib/id';
import { plural } from '../../lib/format';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { useToast } from '../app/Toaster';
import { WalletSelect } from './WalletSelect';

export function exportFileName(walletName: string, month: MonthKey): string {
  return `gastos-${walletSlug(walletName)}-${month}.xlsx`;
}

export function ExportPanel() {
  const { wallet: active, wallets } = useActiveWallet();
  const toast = useToast();
  const [walletId, setWalletId] = useState(active.id);
  const wallet = wallets.find((w) => w.id === walletId) ?? active;
  const [unselected, setUnselected] = useState<Set<MonthKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenses = useLiveQuery(
    () => db.expenses.where('walletId').equals(wallet.id).toArray(),
    [wallet.id],
  );
  const months = useMemo(() => {
    const map = new Map<MonthKey, { total: number; count: number }>();
    for (const e of expenses ?? []) {
      const m = map.get(e.month) ?? { total: 0, count: 0 };
      m.total += e.amountCents;
      m.count += 1;
      map.set(e.month, m);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);
  const selected = months.map(([m]) => m).filter((m) => !unselected.has(m));

  function toggle(m: MonthKey) {
    setUnselected((s) => {
      const next = new Set(s);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      for (const m of [...selected].sort()) {
        const blob = await xlsxAdapter.buildMonthWorkbook(
          await expenseRepository.listByMonth(wallet.id, m),
        );
        await saveFile(blob, exportFileName(wallet.name, m));
      }
      await settingsRepository.update({ lastExportAt: nowIso() });
      toast.show(`${plural(selected.length, 'arquivo gerado', 'arquivos gerados')}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="exp-title" className="flex flex-col gap-4">
      <h1 id="exp-title" className="text-large-title font-bold">
        Exportar planilha
      </h1>
      <p className="text-muted">
        Gera um arquivo .xlsx por mês, com data, descrição, categoria e valor. O arquivo é criado
        aqui no aparelho.
      </p>
      <WalletSelect
        wallets={wallets}
        value={wallet.id}
        onChange={(id) => (setWalletId(id), setUnselected(new Set()))}
        label="Carteira"
      />

      {expenses !== undefined && months.length === 0 ? (
        <EmptyState title="Nenhum gasto para exportar nesta carteira." />
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Meses</legend>
          {months.map(([m, info]) => (
            <label
              key={m}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-2"
            >
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--primary)]"
                checked={!unselected.has(m)}
                onChange={() => toggle(m)}
              />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{formatMonthLabel(m)}</span>
                <span className="tabular text-sm text-muted">
                  {formatMoney(info.total)} · {plural(info.count, 'lançamento', 'lançamentos')}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 font-semibold">
          {error}
        </p>
      )}
      <Button
        icon={<Download aria-hidden size={18} />}
        disabled={busy || selected.length === 0}
        onClick={onExport}
      >
        {busy ? 'Gerando…' : `Baixar ${plural(selected.length, 'arquivo', 'arquivos')}`}
      </Button>
    </section>
  );
}

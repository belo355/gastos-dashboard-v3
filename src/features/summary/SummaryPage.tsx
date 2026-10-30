import { useEffect } from 'react';
import { ChartPie } from 'lucide-react';
import { formatMonthName } from '../../domain/dates';
import { useBudgets } from '../../hooks/useBudgets';
import { useMonthSummary } from '../../hooks/useMonthSummary';
import { SummaryBudgets } from './BudgetOverview';
import { WalletSwitcher } from '../wallets/WalletSwitcher';
import { markSummaryRendered } from '../../lib/perf';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { useAppState } from '../app/AppState';
import { useExpenseForm } from '../expenses/ExpenseFormContext';
import { CategoryBubbles } from './CategoryBubbles';
import { CategoryRanking } from './CategoryRanking';
import { MonthSwitcher } from './MonthSwitcher';
import { MonthTotalCard } from './MonthTotalCard';

export function SummaryPage() {
  const { activeWallet, month } = useAppState();
  const data = useMonthSummary(activeWallet.id, month);
  const budgets = useBudgets(activeWallet.id, month);
  const form = useExpenseForm();

  useEffect(() => {
    if (data) markSummaryRendered();
  }, [data]);

  return (
    <section aria-labelledby="resumo-title" className="flex flex-col gap-4">
      <h1 id="resumo-title" className="text-2xl font-bold">
        Resumo <span className="sr-only">da carteira {activeWallet.name}</span>
      </h1>
      <WalletSwitcher />
      {activeWallet.isSample && (
        <p
          className="rounded-2xl border-2 border-dashed border-warning bg-warning-bg px-3 py-2 text-sm font-semibold"
          data-testid="sample-banner"
        >
          Exemplo · dados fictícios. Explore à vontade e exclua a carteira em Mais → Carteiras
          quando quiser.
        </p>
      )}
      <MonthSwitcher />

      {!data ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <>
          <MonthTotalCard
            month={month}
            totalCents={data.summary.totalCents}
            count={data.summary.count}
            comparison={data.comparison}
          />
          {data.summary.categories.length === 0 ? (
            <EmptyState
              icon={<ChartPie size={40} aria-hidden />}
              title={`Nenhum gasto em ${formatMonthName(month)} ainda.`}
              action={<Button onClick={form.openNew}>Lançar</Button>}
            >
              Toque em Lançar para começar.
            </EmptyState>
          ) : (
            <>
              <section
                aria-labelledby="dist-title"
                className="rounded-3xl bg-surface p-4 shadow-sm"
              >
                <h2 id="dist-title" className="mb-2 text-lg font-bold">
                  Para onde foi o dinheiro
                </h2>
                <CategoryBubbles categories={data.summary.categories} />
              </section>
              <section aria-labelledby="rank-title" className="flex flex-col gap-2">
                <h2 id="rank-title" className="text-lg font-bold">
                  Ranking das categorias
                </h2>
                <CategoryRanking categories={data.summary.categories} />
              </section>
            </>
          )}
          {budgets && <SummaryBudgets data={budgets} />}
        </>
      )}
    </section>
  );
}

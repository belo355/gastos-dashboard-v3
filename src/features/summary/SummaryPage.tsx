import { useEffect } from 'react';
import { ChartPie, FlaskConical } from 'lucide-react';
import { formatMonthName } from '../../domain/dates';
import { useBudgets } from '../../hooks/useBudgets';
import { useMonthSummary } from '../../hooks/useMonthSummary';
import { SummaryBudgets } from './BudgetOverview';
import { WalletSwitcher } from '../wallets/WalletSwitcher';
import { markSummaryRendered } from '../../lib/perf';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Panel, SectionHeader } from '../../ui/Grouped';
import { PageHeader } from '../../ui/PageHeader';
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
    <section aria-labelledby="resumo-title" className="flex flex-col gap-3">
      <PageHeader id="resumo-title" title="Resumo" srSuffix={`da carteira ${activeWallet.name}`} />
      <WalletSwitcher />
      {activeWallet.isSample && <SampleBanner />}
      <MonthSwitcher />

      {!data ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <>
          <Panel
            labelledBy={data.summary.categories.length > 0 ? 'dist-title' : undefined}
            className="flex flex-col gap-4"
          >
            <MonthTotalCard
              month={month}
              totalCents={data.summary.totalCents}
              count={data.summary.count}
              comparison={data.comparison}
            />
            {data.summary.categories.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-separator pt-4">
                <h2 id="dist-title" className="text-headline font-semibold">
                  Para onde foi o dinheiro
                </h2>
                <CategoryBubbles categories={data.summary.categories} />
              </div>
            )}
          </Panel>
          {data.summary.categories.length === 0 ? (
            <EmptyState
              icon={<ChartPie size={56} strokeWidth={1.5} aria-hidden />}
              title={`Nenhum gasto em ${formatMonthName(month)} ainda.`}
              action={<Button onClick={form.openNew}>Lançar</Button>}
            >
              Toque em Lançar para começar.
            </EmptyState>
          ) : (
            <section aria-labelledby="rank-title" className="flex flex-col gap-2">
              <SectionHeader id="rank-title" title="Ranking das categorias" />
              <CategoryRanking categories={data.summary.categories} />
            </section>
          )}
          {budgets && <SummaryBudgets data={budgets} />}
        </>
      )}
    </section>
  );
}

function SampleBanner() {
  return (
    <p
      className="flex gap-3 rounded-2xl bg-warning-bg px-4 py-3 text-subhead"
      data-testid="sample-banner"
    >
      <FlaskConical aria-hidden size={20} className="mt-px shrink-0 text-warning" />
      <span>
        <strong className="font-semibold">Exemplo · dados fictícios.</strong> Explore à vontade e
        exclua a carteira em Mais → Carteiras quando quiser.
      </span>
    </p>
  );
}

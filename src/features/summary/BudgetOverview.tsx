import { Link } from 'react-router';
import { formatMoney } from '../../domain/money';
import type { BudgetsData } from '../../hooks/useBudgets';
import { BudgetRow } from '../budget/BudgetRow';

/** Total orçado, gasto nas categorias orçadas e saldo do mês. */
export function BudgetOverview({ totals }: { totals: BudgetsData['totals'] }) {
  const over = totals.excessCents > 0;
  return (
    <dl
      className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-3 text-center shadow-sm"
      data-testid="budget-overview"
    >
      <div>
        <dt className="text-xs font-semibold text-muted">Orçado</dt>
        <dd className="tabular font-bold" data-testid="budget-total">
          {formatMoney(totals.budgetedCents)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-muted">Gasto</dt>
        <dd className="tabular font-bold" data-testid="budget-spent-total">
          {formatMoney(totals.spentCents)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-muted">{over ? 'Acima do orçado' : 'Saldo'}</dt>
        <dd
          className={`tabular font-bold ${over ? 'text-danger' : 'text-ok'}`}
          data-testid="budget-balance"
        >
          {formatMoney(over ? totals.excessCents : totals.remainingCents)}
        </dd>
      </div>
    </dl>
  );
}

/** Bloco do resumo com o orçamento das categorias orçadas. */
export function SummaryBudgets({ data }: { data: BudgetsData }) {
  if (data.rows.length === 0) {
    return (
      <Link
        to="/orcamento"
        className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-dashed border-border px-4 text-center font-semibold text-primary"
      >
        Defina limites por categoria para acompanhar seu orçamento
      </Link>
    );
  }
  return (
    <section aria-labelledby="sum-budget-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 id="sum-budget-title" className="text-lg font-bold">
          Orçamento do mês
        </h2>
        <Link
          to="/orcamento"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
        >
          Gerenciar
        </Link>
      </div>
      <BudgetOverview totals={data.totals} />
      <ul aria-label="Orçamento por categoria" className="flex flex-col gap-2">
        {data.rows.map((r) => (
          <li key={r.categoryId}>
            <BudgetRow categoryId={r.categoryId} progress={r.progress} />
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { ReceiptText } from 'lucide-react';
import { getCategory, isCategoryId, type CategoryId } from '../../domain/categories';
import { formatDate, formatMonthName } from '../../domain/dates';
import { formatMoney } from '../../domain/money';
import { summarizeMonth } from '../../domain/summary';
import type { Expense } from '../../domain/types';
import { useMonthExpenses } from '../../hooks/useMonthExpenses';
import { Button } from '../../ui/Button';
import { CategoryBadge } from '../../ui/CategoryIcon';
import { EmptyState } from '../../ui/EmptyState';
import { useAppState } from '../app/AppState';
import { MonthSwitcher } from '../summary/MonthSwitcher';
import { WalletSwitcher } from '../wallets/WalletSwitcher';
import { useExpenseForm } from './ExpenseFormContext';

export function ExpensesPage() {
  const { activeWallet, month } = useAppState();
  const expenses = useMonthExpenses(activeWallet.id, month);
  const [params, setParams] = useSearchParams();
  const raw = params.get('categoria');
  const filter: CategoryId | null = isCategoryId(raw) ? raw : null;
  const form = useExpenseForm();

  const present = useMemo(
    () => summarizeMonth(expenses ?? []).categories.map((c) => c.categoryId),
    [expenses],
  );
  const visible = useMemo(
    () => (expenses ?? []).filter((e) => !filter || e.categoryId === filter),
    [expenses, filter],
  );
  const total = visible.reduce((a, e) => a + e.amountCents, 0);

  function setFilter(id: CategoryId | null) {
    const next = new URLSearchParams(params);
    if (id) next.set('categoria', id);
    else next.delete('categoria');
    setParams(next, { replace: true });
  }

  return (
    <section aria-labelledby="lanc-title" className="flex flex-col gap-4">
      <h1 id="lanc-title" className="text-2xl font-bold">
        Lançamentos
      </h1>
      <WalletSwitcher />
      <MonthSwitcher />

      {(present.length > 0 || filter) && (
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        >
          <FilterChip active={!filter} onClick={() => setFilter(null)}>
            Todas
          </FilterChip>
          {[...new Set([...(filter ? [filter] : []), ...present])].map((id) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)}>
              <CategoryBadge id={id} size={22} />
              {getCategory(id).name}
            </FilterChip>
          ))}
        </div>
      )}

      {expenses === undefined ? (
        <p className="text-muted">Carregando…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={40} aria-hidden />}
          title={
            filter
              ? `Nenhum gasto em ${getCategory(filter).name} em ${formatMonthName(month)}.`
              : `Nenhum gasto em ${formatMonthName(month)} ainda.`
          }
          action={<Button onClick={form.openNew}>Lançar</Button>}
        >
          Toque em Lançar para começar.
        </EmptyState>
      ) : (
        <>
          <p className="text-muted">
            {visible.length} {visible.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
            <span className="tabular font-semibold text-text">{formatMoney(total)}</span>
          </p>
          <ul aria-label="Lançamentos do mês" className="flex flex-col gap-2">
            {visible.map((e) => (
              <li key={e.id}>
                <ExpenseRow expense={e} onOpen={() => form.openEdit(e)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold ${
        active ? 'border-primary bg-primary text-primary-ink' : 'border-border bg-surface text-text'
      }`}
    >
      {children}
    </button>
  );
}

export function ExpenseRow({ expense, onOpen }: { expense: Expense; onOpen: () => void }) {
  const cat = getCategory(expense.categoryId);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="expense-row"
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-surface px-3 py-2 text-left shadow-sm hover:bg-surface-2"
    >
      <CategoryBadge id={expense.categoryId} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{expense.description ?? cat.name}</span>
        <span className="text-sm text-muted">
          {cat.name} · {formatDate(expense.date)}
        </span>
      </span>
      <span className="tabular shrink-0 font-bold">{formatMoney(expense.amountCents)}</span>
      <span className="sr-only">. Editar</span>
    </button>
  );
}

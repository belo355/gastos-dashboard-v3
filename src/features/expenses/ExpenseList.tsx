import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { ReceiptText } from 'lucide-react';
import { getCategory, isCategoryId, type CategoryId } from '../../domain/categories';
import { formatDate, formatDayHeading, formatMonthName, today } from '../../domain/dates';
import { formatMoney } from '../../domain/money';
import { summarizeMonth } from '../../domain/summary';
import type { Expense } from '../../domain/types';
import { useMonthExpenses } from '../../hooks/useMonthExpenses';
import { Button } from '../../ui/Button';
import { CategoryBadge } from '../../ui/CategoryIcon';
import { EmptyState } from '../../ui/EmptyState';
import { GroupedList } from '../../ui/Grouped';
import { PageHeader } from '../../ui/PageHeader';
import { useAppState } from '../app/AppState';
import { MonthSwitcher } from '../summary/MonthSwitcher';
import { WalletSwitcher } from '../wallets/WalletSwitcher';
import { useExpenseForm } from './ExpenseFormContext';

/** Agrupa lançamentos já ordenados (mais recente primeiro) por dia, mantendo a ordem. */
function groupByDay(expenses: Expense[]): { date: string; items: Expense[]; total: number }[] {
  const groups: { date: string; items: Expense[]; total: number }[] = [];
  for (const e of expenses) {
    const last = groups[groups.length - 1];
    if (last && last.date === e.date) {
      last.items.push(e);
      last.total += e.amountCents;
    } else {
      groups.push({ date: e.date, items: [e], total: e.amountCents });
    }
  }
  return groups;
}

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
  const days = useMemo(() => groupByDay(visible), [visible]);
  const total = visible.reduce((a, e) => a + e.amountCents, 0);
  const now = today();

  function setFilter(id: CategoryId | null) {
    const next = new URLSearchParams(params);
    if (id) next.set('categoria', id);
    else next.delete('categoria');
    setParams(next, { replace: true });
  }

  return (
    <section aria-labelledby="lanc-title" className="flex flex-col gap-3">
      <PageHeader id="lanc-title" title="Lançamentos" />
      <WalletSwitcher />
      <MonthSwitcher />

      {(present.length > 0 || filter) && (
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]"
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
          icon={<ReceiptText size={56} strokeWidth={1.5} aria-hidden />}
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
          <p className="px-1 text-subhead text-muted">
            {visible.length} {visible.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
            <span className="figure font-semibold text-text">{formatMoney(total)}</span>
          </p>
          <ul aria-label="Lançamentos do mês" className="flex flex-col gap-4">
            {days.map((day) => (
              <li key={day.date} className="flex flex-col gap-1.5">
                <h2 className="flex items-baseline justify-between gap-3 px-4 text-footnote font-semibold text-muted">
                  <span className="first-letter:uppercase">{formatDayHeading(day.date, now)}</span>
                  {day.items.length > 1 && (
                    <span className="figure">
                      <span className="sr-only">Total do dia: </span>
                      {formatMoney(day.total)}
                    </span>
                  )}
                </h2>
                <GroupedList>
                  {day.items.map((e) => (
                    <li key={e.id}>
                      <ExpenseRow expense={e} onOpen={() => form.openEdit(e)} />
                    </li>
                  ))}
                </GroupedList>
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full pl-2.5 pr-4 text-subhead font-semibold first:pl-4 ${
        active ? 'bg-text text-surface' : 'bg-surface text-text hover:bg-surface-2'
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
      className="flex min-h-[3.75rem] w-full items-center gap-3 pl-4 text-left hover:bg-surface-2/60 active:bg-surface-2"
    >
      <CategoryBadge id={expense.categoryId} size={34} />
      <span className="row-body flex min-w-0 flex-1 items-center gap-3 self-stretch py-2.5 pr-4">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{expense.description ?? cat.name}</span>
          <span className="text-footnote text-muted">
            {cat.name} · {formatDate(expense.date)}
          </span>
        </span>
        <span className="figure shrink-0 font-semibold">{formatMoney(expense.amountCents)}</span>
      </span>
      <span className="sr-only">. Editar</span>
    </button>
  );
}

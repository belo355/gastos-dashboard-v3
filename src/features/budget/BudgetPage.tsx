import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { CATEGORIES, getCategory, type CategoryId } from '../../domain/categories';
import { formatMoney } from '../../domain/money';
import { useBudgets } from '../../hooks/useBudgets';
import { IconButton } from '../../ui/Button';
import { CategoryBadge } from '../../ui/CategoryIcon';
import { useAppState } from '../app/AppState';
import { BudgetOverview } from '../summary/BudgetOverview';
import { MonthSwitcher } from '../summary/MonthSwitcher';
import { WalletSwitcher } from '../wallets/WalletSwitcher';
import { BudgetEditor } from './BudgetEditor';
import { BudgetRow } from './BudgetRow';

export function BudgetPage() {
  const { activeWallet, month } = useAppState();
  const data = useBudgets(activeWallet.id, month);
  const [editing, setEditing] = useState<CategoryId | null>(null);

  return (
    <section aria-labelledby="orc-title" className="flex flex-col gap-4">
      <h1 id="orc-title" className="text-2xl font-bold">
        Orçamento
      </h1>
      <WalletSwitcher />
      <MonthSwitcher />
      <p className="text-muted">
        Defina quanto quer gastar por mês em cada categoria e acompanhe o progresso.
      </p>

      {data && (
        <>
          {data.rows.length > 0 && <BudgetOverview totals={data.totals} />}

          <ul aria-label="Categorias com limite" className="flex flex-col gap-2">
            {data.rows.map(({ categoryId, progress }) => (
              <li key={categoryId}>
                <BudgetRow
                  categoryId={categoryId}
                  progress={progress}
                  action={
                    <IconButton
                      label={`Alterar limite de ${getCategory(categoryId).name}`}
                      icon={<Pencil aria-hidden size={18} />}
                      onClick={() => setEditing(categoryId)}
                    />
                  }
                />
              </li>
            ))}
          </ul>

          <h2 className="mt-2 text-lg font-bold">
            {data.rows.length > 0 ? 'Outras categorias' : 'Escolha uma categoria para começar'}
          </h2>
          <ul aria-label="Categorias sem limite" className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.filter((c) => !data.limits.has(c.id)).map((c) => {
              const spent = data.spentByCategory.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(c.id)}
                    data-testid="budget-define"
                    data-category={c.id}
                    className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-3 py-2 text-left hover:bg-surface-2"
                  >
                    <CategoryBadge id={c.id} size={32} />
                    <span className="flex flex-1 flex-col">
                      <span className="font-semibold">{c.name}</span>
                      {spent > 0 && (
                        <span className="tabular text-sm text-muted">
                          {formatMoney(spent)} no mês
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      <Plus aria-hidden size={16} /> Definir limite
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <BudgetEditor
        walletId={activeWallet.id}
        month={month}
        categoryId={editing}
        currentLimit={editing ? data?.limits.get(editing) : undefined}
        onClose={() => setEditing(null)}
      />
    </section>
  );
}

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { CATEGORIES, getCategory, type CategoryId } from '../../domain/categories';
import { formatMoney } from '../../domain/money';
import { useBudgets } from '../../hooks/useBudgets';
import { IconButton } from '../../ui/Button';
import { CategoryBadge } from '../../ui/CategoryIcon';
import { GroupedList, SectionHeader } from '../../ui/Grouped';
import { PageHeader } from '../../ui/PageHeader';
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
    <section aria-labelledby="orc-title" className="flex flex-col gap-3">
      <PageHeader id="orc-title" title="Orçamento" />
      <WalletSwitcher />
      <MonthSwitcher />
      <p className="px-1 text-subhead text-muted">
        Defina quanto quer gastar por mês em cada categoria e acompanhe o progresso.
      </p>

      {data && (
        <>
          {data.rows.length > 0 && <BudgetOverview totals={data.totals} />}

          {data.rows.length > 0 && (
            <GroupedList label="Categorias com limite">
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
                        className="-mr-2"
                      />
                    }
                  />
                </li>
              ))}
            </GroupedList>
          )}

          <SectionHeader
            title={
              data.rows.length > 0 ? 'Outras categorias' : 'Escolha uma categoria para começar'
            }
          />
          <GroupedList label="Categorias sem limite">
            {CATEGORIES.filter((c) => !data.limits.has(c.id)).map((c) => {
              const spent = data.spentByCategory.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(c.id)}
                    data-testid="budget-define"
                    data-category={c.id}
                    className="flex min-h-14 w-full items-center gap-3 pl-4 text-left hover:bg-surface-2/60 active:bg-surface-2"
                  >
                    <CategoryBadge id={c.id} size={30} />
                    <span className="row-body flex flex-1 items-center gap-3 self-stretch py-2 pr-4">
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium">{c.name}</span>
                        {spent > 0 && (
                          <span className="figure text-footnote text-muted">
                            {formatMoney(spent)} no mês
                          </span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-subhead font-semibold text-tint">
                        <Plus aria-hidden size={16} strokeWidth={2.5} /> Definir limite
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </GroupedList>
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

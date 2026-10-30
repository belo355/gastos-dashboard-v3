import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { getCategory } from '../../domain/categories';
import { formatMoney } from '../../domain/money';
import type { CategoryTotal } from '../../domain/types';
import { formatPercent, plural } from '../../lib/format';
import { CategoryBadge, categoryColor } from '../../ui/CategoryIcon';

/** Ranking das categorias (maior gasto primeiro) — também o equivalente textual das bolhas. */
export function CategoryRanking({ categories }: { categories: CategoryTotal[] }) {
  const max = categories[0]?.totalCents ?? 1;
  return (
    <ol aria-label="Gastos por categoria, do maior para o menor" className="flex flex-col gap-2">
      {categories.map((c) => {
        const cat = getCategory(c.categoryId);
        return (
          <li key={c.categoryId}>
            <Link
              to={`/lancamentos?categoria=${c.categoryId}`}
              data-testid="ranking-row"
              data-category={c.categoryId}
              className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface px-3 py-2 shadow-sm hover:bg-surface-2"
            >
              <span className="w-6 text-center text-sm font-bold text-muted">{c.rank}º</span>
              <CategoryBadge id={c.categoryId} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{cat.name}</span>
                  <span className="tabular shrink-0 font-bold" data-testid="ranking-value">
                    {formatMoney(c.totalCents)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(c.totalCents / max) * 100}%`,
                        background: categoryColor(c.categoryId),
                      }}
                    />
                  </span>
                  <span
                    className="tabular w-14 text-right text-sm font-semibold"
                    data-testid="ranking-percent"
                  >
                    {formatPercent(c.percent)}
                  </span>
                </span>
                <span className="text-xs text-muted">
                  {plural(c.count, 'lançamento', 'lançamentos')}
                </span>
              </span>
              <ChevronRight aria-hidden size={18} className="text-muted" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

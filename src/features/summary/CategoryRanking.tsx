import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { getCategory } from '../../domain/categories';
import { formatMoney } from '../../domain/money';
import type { CategoryTotal } from '../../domain/types';
import { formatPercent, plural } from '../../lib/format';
import { CategoryBadge, categoryColor } from '../../ui/CategoryIcon';
import { GroupedList } from '../../ui/Grouped';

/**
 * Ranking das categorias (maior gasto primeiro) — também o equivalente textual das bolhas.
 * Cada linha segue a lista "Mais usados" do Tempo de Uso: ícone, nome, barra fina e valor.
 */
export function CategoryRanking({ categories }: { categories: CategoryTotal[] }) {
  const max = categories[0]?.totalCents ?? 1;
  return (
    <GroupedList ordered label="Gastos por categoria, do maior para o menor">
      {categories.map((c) => {
        const cat = getCategory(c.categoryId);
        return (
          <li key={c.categoryId}>
            <Link
              to={`/lancamentos?categoria=${c.categoryId}`}
              data-testid="ranking-row"
              data-category={c.categoryId}
              className="flex min-h-14 items-center gap-3 pl-4 hover:bg-surface-2/60 active:bg-surface-2"
            >
              <CategoryBadge id={c.categoryId} size={34} />
              <span className="row-body flex min-w-0 flex-1 items-center gap-2 self-stretch py-2.5 pr-3">
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{cat.name}</span>
                    <span className="figure shrink-0 font-semibold" data-testid="ranking-value">
                      {formatMoney(c.totalCents)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                    >
                      <span
                        className="progress-fill block h-full rounded-full"
                        style={{
                          width: `${(c.totalCents / max) * 100}%`,
                          background: categoryColor(c.categoryId),
                        }}
                      />
                    </span>
                    <span className="w-[9.75rem] shrink-0 whitespace-nowrap text-right text-footnote text-muted">
                      <span className="figure font-semibold" data-testid="ranking-percent">
                        {formatPercent(c.percent)}
                      </span>{' '}
                      · {plural(c.count, 'lançamento', 'lançamentos')}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  size={18}
                  strokeWidth={2.5}
                  className="shrink-0 text-border"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </GroupedList>
  );
}

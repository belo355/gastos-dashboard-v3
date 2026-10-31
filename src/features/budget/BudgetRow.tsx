import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, OctagonAlert } from 'lucide-react';
import { getCategory, type CategoryId } from '../../domain/categories';
import type { BudgetProgress, BudgetState } from '../../domain/types';
import { CategoryBadge, categoryColor } from '../../ui/CategoryIcon';
import { ProgressBar } from '../../ui/ProgressBar';
import { percentText, remainingText, spentOfLimit, STATE_LABEL } from './budgetText';

const STATE_STYLE: Record<BudgetState, string> = {
  ok: 'bg-ok-bg text-ok',
  warning: 'bg-warning-bg text-warning',
  over: 'bg-danger-bg text-danger',
};

function StateIcon({ state }: { state: BudgetState }) {
  if (state === 'ok') return <CircleCheck aria-hidden size={14} strokeWidth={2.5} />;
  if (state === 'warning') return <CircleAlert aria-hidden size={14} strokeWidth={2.5} />;
  return <OctagonAlert aria-hidden size={14} strokeWidth={2.5} />;
}

export function BudgetStateTag({ state }: { state: BudgetState }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold ${STATE_STYLE[state]}`}
      data-testid="budget-state"
    >
      <StateIcon state={state} />
      {STATE_LABEL[state]}
    </span>
  );
}

/**
 * Uma categoria com limite: estado (texto + ícone + cor), barra e valores.
 * Feita para ficar dentro de uma lista agrupada (o separador vem de `.row-body`).
 */
export function BudgetRow({
  categoryId,
  progress,
  action,
}: {
  categoryId: CategoryId;
  progress: BudgetProgress;
  action?: ReactNode;
}) {
  const name = getCategory(categoryId).name;
  return (
    <div
      className="flex gap-3 pl-4"
      data-testid="budget-row"
      data-category={categoryId}
      data-state={progress.status}
    >
      <span className="pt-3.5">
        <CategoryBadge id={categoryId} size={34} />
      </span>
      <div className="row-body flex min-w-0 flex-1 flex-col gap-2 py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-semibold">{name}</span>
            <BudgetStateTag state={progress.status} />
          </div>
          <span className="figure text-title3 font-bold" data-testid="budget-percent">
            {percentText(progress)}
          </span>
          {action}
        </div>
        <ProgressBar
          color={categoryColor(categoryId)}
          ratio={progress.ratio}
          status={progress.status}
          label={`Orçamento de ${name}`}
          valueText={`${percentText(progress)}, ${STATE_LABEL[progress.status]}. ${spentOfLimit(progress)}. ${remainingText(progress)}.`}
        />
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-footnote">
          <span className="figure text-muted" data-testid="budget-spent">
            {spentOfLimit(progress)}
          </span>
          <span
            className={`figure font-semibold ${progress.status === 'over' ? 'text-danger' : ''}`}
            data-testid="budget-remaining"
          >
            {remainingText(progress)}
          </span>
        </div>
      </div>
    </div>
  );
}

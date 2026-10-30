import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, OctagonAlert } from 'lucide-react';
import { getCategory, type CategoryId } from '../../domain/categories';
import type { BudgetProgress, BudgetState } from '../../domain/types';
import { CategoryBadge } from '../../ui/CategoryIcon';
import { ProgressBar } from '../../ui/ProgressBar';
import { percentText, remainingText, spentOfLimit, STATE_LABEL } from './budgetText';

const STATE_STYLE: Record<BudgetState, string> = {
  ok: 'bg-ok-bg text-ok',
  warning: 'bg-warning-bg text-warning',
  over: 'bg-danger-bg text-danger',
};

function StateIcon({ state }: { state: BudgetState }) {
  if (state === 'ok') return <CircleCheck aria-hidden size={16} />;
  if (state === 'warning') return <CircleAlert aria-hidden size={16} />;
  return <OctagonAlert aria-hidden size={16} />;
}

export function BudgetStateTag({ state }: { state: BudgetState }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${STATE_STYLE[state]}`}
      data-testid="budget-state"
    >
      <StateIcon state={state} />
      {STATE_LABEL[state]}
    </span>
  );
}

/** Uma categoria com limite: estado (texto + ícone + cor), barra e valores. */
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
      className="flex flex-col gap-2 rounded-2xl bg-surface p-3 shadow-sm"
      data-testid="budget-row"
      data-category={categoryId}
      data-state={progress.status}
    >
      <div className="flex items-center gap-3">
        <CategoryBadge id={categoryId} size={36} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{name}</span>
          <BudgetStateTag state={progress.status} />
        </div>
        <span className="tabular text-lg font-extrabold" data-testid="budget-percent">
          {percentText(progress)}
        </span>
        {action}
      </div>
      <ProgressBar
        ratio={progress.ratio}
        status={progress.status}
        label={`Orçamento de ${name}`}
        valueText={`${percentText(progress)}, ${STATE_LABEL[progress.status]}. ${spentOfLimit(progress)}. ${remainingText(progress)}.`}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="tabular text-muted" data-testid="budget-spent">
          {spentOfLimit(progress)}
        </span>
        <span
          className={`tabular font-semibold ${progress.status === 'over' ? 'text-danger' : ''}`}
          data-testid="budget-remaining"
        >
          {remainingText(progress)}
        </span>
      </div>
    </div>
  );
}

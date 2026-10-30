import { Equal, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { addMonths, formatMonthName } from '../../domain/dates';
import { formatMoney } from '../../domain/money';
import type { MonthComparison, MonthKey } from '../../domain/types';
import { formatPercent, plural } from '../../lib/format';
import { AnimatedMoney } from './AnimatedMoney';

interface Props {
  month: MonthKey;
  totalCents: number;
  count: number;
  comparison: MonthComparison;
}

export function MonthTotalCard({ month, totalCents, count, comparison }: Props) {
  const prev = formatMonthName(addMonths(month, -1));
  return (
    <div className="rounded-3xl bg-primary p-5 text-primary-ink shadow-lg">
      <p className="text-sm font-semibold opacity-90">Total gasto em {formatMonthName(month)}</p>
      {/* O número animado é visual; o valor final vai direto para leitores de tela. */}
      <p
        className="tabular mt-1 text-4xl font-extrabold tracking-tight"
        data-testid="month-total"
        aria-hidden
      >
        <AnimatedMoney cents={totalCents} />
      </p>
      <p className="sr-only" aria-live="polite" data-testid="month-total-live">
        {formatMoney(totalCents)}
      </p>
      <p className="mt-1 text-sm font-medium opacity-90">
        {plural(count, 'lançamento', 'lançamentos')}
      </p>
      <ComparisonLine comparison={comparison} prev={prev} hasCurrent={totalCents > 0} />
    </div>
  );
}

function ComparisonLine({
  comparison,
  prev,
  hasCurrent,
}: {
  comparison: MonthComparison;
  prev: string;
  hasCurrent: boolean;
}) {
  const { direction, deltaCents, deltaPercent } = comparison;
  if (direction === 'no_previous') {
    if (!hasCurrent) return null;
    return (
      <p
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-ink/15 px-3 py-1 text-sm font-semibold"
        data-testid="month-comparison"
      >
        <Sparkles aria-hidden size={16} /> Primeiro mês com gastos
      </p>
    );
  }
  if (direction === 'equal') {
    return (
      <p
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-ink/15 px-3 py-1 text-sm font-semibold"
        data-testid="month-comparison"
      >
        <Equal aria-hidden size={16} /> Igual a {prev}
      </p>
    );
  }
  const more = direction === 'more';
  const Icon = more ? TrendingUp : TrendingDown;
  const sign = more ? '+' : '−';
  return (
    <p
      className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-primary-ink/15 px-3 py-1 text-sm font-semibold"
      data-testid="month-comparison"
    >
      <Icon aria-hidden size={16} />
      <span>{more ? `Gastou mais que em ${prev}` : `Gastou menos que em ${prev}`}:</span>
      <span className="tabular">
        {sign}
        {formatMoney(Math.abs(deltaCents))} ({sign}
        {formatPercent(Math.abs(deltaPercent ?? 0))})
      </span>
    </p>
  );
}

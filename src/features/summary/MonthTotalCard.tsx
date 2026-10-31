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

/** Cabeçalho do cartão do mês, como os cartões do Tempo de Uso: rótulo, valor grande e variação. */
export function MonthTotalCard({ month, totalCents, count, comparison }: Props) {
  const prev = formatMonthName(addMonths(month, -1));
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-subhead font-semibold text-muted">
        Total gasto em {formatMonthName(month)}
      </p>
      {/* O número animado é visual; o valor final vai direto para leitores de tela. */}
      <p
        className="figure text-[2.625rem] leading-[1.1] font-bold"
        data-testid="month-total"
        aria-hidden
      >
        <AnimatedMoney cents={totalCents} />
      </p>
      <p className="sr-only" aria-live="polite" data-testid="month-total-live">
        {formatMoney(totalCents)}
      </p>
      <p className="text-subhead text-muted">{plural(count, 'lançamento', 'lançamentos')}</p>
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
  const base = 'mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-subhead font-semibold';
  if (direction === 'no_previous') {
    if (!hasCurrent) return null;
    return (
      <p className={`${base} text-tint`} data-testid="month-comparison">
        <Sparkles aria-hidden size={16} strokeWidth={2.5} /> Primeiro mês com gastos
      </p>
    );
  }
  if (direction === 'equal') {
    return (
      <p className={`${base} text-muted`} data-testid="month-comparison">
        <Equal aria-hidden size={16} strokeWidth={2.5} /> Igual a {prev}
      </p>
    );
  }
  const more = direction === 'more';
  const Icon = more ? TrendingUp : TrendingDown;
  const sign = more ? '+' : '−';
  return (
    <p className={`${base} ${more ? 'text-danger' : 'text-ok'}`} data-testid="month-comparison">
      <Icon aria-hidden size={16} strokeWidth={2.5} />
      <span>{more ? `Gastou mais que em ${prev}` : `Gastou menos que em ${prev}`}:</span>
      <span className="figure">
        {sign}
        {formatMoney(Math.abs(deltaCents))} ({sign}
        {formatPercent(Math.abs(deltaPercent ?? 0))})
      </span>
    </p>
  );
}

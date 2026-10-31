import { Link } from 'react-router';
import { ChevronRight, Target } from 'lucide-react';
import { formatMoney } from '../../domain/money';
import { budgetPercent, budgetStatus } from '../../domain/budget';
import type { BudgetState } from '../../domain/types';
import type { BudgetsData } from '../../hooks/useBudgets';
import { BudgetRow } from '../budget/BudgetRow';
import { GroupedList, SectionHeader } from '../../ui/Grouped';

const RING_COLOR: Record<BudgetState, string> = {
  ok: 'var(--tint)',
  warning: 'var(--tint)',
  over: 'var(--danger)',
};

/**
 * Anel do orçamento, como os anéis do app Atividade: o arco é o gasto sobre o orçado;
 * acima de 100% uma segunda volta mais escura mostra o excesso. Decorativo: os números ao lado
 * dizem o mesmo em texto.
 */
function BudgetRing({
  ratio,
  state,
  size = 96,
}: {
  ratio: number;
  state: BudgetState;
  size?: number;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const first = Math.min(ratio, 1);
  const lap = Math.min(Math.max(ratio - 1, 0), 1);
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      data-testid="budget-ring"
      data-state={state}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={RING_COLOR[state]}
        strokeOpacity={0.18}
        strokeWidth={stroke}
      />
      <circle
        className="ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={RING_COLOR[state]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - first)}
      />
      {lap === 0 && first > 0.9 && (
        // Perto de fechar a volta, a ponta passa por cima do início com uma sombra, como no Atividade.
        // A ponta gira junto com o arco (mesma duração e curva), em vez de saltar para o fim.
        <g
          className="ring-cap"
          style={{
            transform: `rotate(${first * 360}deg)`,
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        >
          <circle
            cx={size / 2 + r}
            cy={size / 2}
            r={stroke / 2}
            fill={RING_COLOR[state]}
            className="[filter:drop-shadow(0_1px_1.5px_rgb(0_0_0/0.35))]"
          />
        </g>
      )}
      {lap > 0 && (
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--text)"
          strokeOpacity={0.35}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - lap)}
        />
      )}
    </svg>
  );
}

/** Total orçado, gasto nas categorias orçadas e saldo do mês, com o anel ao lado. */
export function BudgetOverview({ totals }: { totals: BudgetsData['totals'] }) {
  const over = totals.excessCents > 0;
  const progress = budgetStatus(totals.spentCents, totals.budgetedCents);
  const ratio = totals.budgetedCents > 0 ? totals.spentCents / totals.budgetedCents : 0;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl bg-surface p-4"
      data-testid="budget-overview"
    >
      <div className="relative">
        <BudgetRing ratio={ratio} state={progress.status} />
        <span className="figure absolute inset-0 flex items-center justify-center text-subhead font-bold">
          {budgetPercent(progress)}%
        </span>
      </div>
      <dl className="grid flex-1 grid-cols-1 gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-subhead text-muted">Orçado</dt>
          <dd className="figure font-semibold" data-testid="budget-total">
            {formatMoney(totals.budgetedCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-subhead text-muted">Gasto</dt>
          <dd className="figure font-semibold" data-testid="budget-spent-total">
            {formatMoney(totals.spentCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2 border-t border-separator pt-1.5">
          <dt className="text-subhead font-semibold">{over ? 'Acima do orçado' : 'Saldo'}</dt>
          <dd
            className={`figure text-headline font-bold ${over ? 'text-danger' : 'text-ok'}`}
            data-testid="budget-balance"
          >
            {formatMoney(over ? totals.excessCents : totals.remainingCents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Bloco do resumo com o orçamento das categorias orçadas. */
export function SummaryBudgets({ data }: { data: BudgetsData }) {
  if (data.rows.length === 0) {
    return (
      <Link
        to="/orcamento"
        className="press mt-3 flex min-h-16 items-center gap-3 rounded-2xl bg-surface px-4 py-3 hover:bg-surface-2/60"
      >
        <Target aria-hidden size={24} className="shrink-0 text-tint" />
        <span className="flex-1 font-semibold text-tint">
          Defina limites por categoria para acompanhar seu orçamento
        </span>
        <ChevronRight aria-hidden size={18} strokeWidth={2.5} className="shrink-0 text-border" />
      </Link>
    );
  }
  return (
    <section aria-labelledby="sum-budget-title" className="flex flex-col gap-2">
      <SectionHeader
        id="sum-budget-title"
        title="Orçamento do mês"
        action={
          <Link
            to="/orcamento"
            className="inline-flex min-h-11 items-center px-1 text-body text-tint"
          >
            Gerenciar
          </Link>
        }
      />
      <BudgetOverview totals={data.totals} />
      <GroupedList label="Orçamento por categoria">
        {data.rows.map((r) => (
          <li key={r.categoryId}>
            <BudgetRow categoryId={r.categoryId} progress={r.progress} />
          </li>
        ))}
      </GroupedList>
    </section>
  );
}

import type { BudgetState } from '../domain/types';

const FILL: Record<BudgetState, string> = {
  ok: 'bg-ok',
  warning: 'bg-warning',
  over: 'bg-danger',
};

/** Barra de progresso do orçamento; a parte visual satura em 100% e o texto vem em aria-valuetext. */
export function ProgressBar({
  ratio,
  status,
  label,
  valueText,
}: {
  ratio: number;
  status: BudgetState;
  label: string;
  valueText: string;
}) {
  const pct = Math.round(ratio * 100);
  const width = Math.min(Math.max(ratio, 0), 1) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(pct, 100)}
      aria-valuetext={valueText}
      className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={`progress-fill h-full rounded-full ${FILL[status]}`}
        style={{ width: `${width}%` }}
      />
      {status === 'over' && (
        // Listras indicam o excesso também sem depender da cor.
        <div
          aria-hidden
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 6px, var(--surface) 6px 9px)',
          }}
        />
      )}
    </div>
  );
}

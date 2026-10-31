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
  color,
}: {
  ratio: number;
  status: BudgetState;
  label: string;
  valueText: string;
  /** Cor do preenchimento dentro do limite (ex.: a cor da categoria); acima do limite é sempre vermelho. */
  color?: string;
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
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div
        className={`progress-fill h-full rounded-full ${color && status !== 'over' ? '' : FILL[status]}`}
        style={{
          width: `${width}%`,
          ...(color && status !== 'over' ? { background: color } : {}),
        }}
      />
      {status === 'over' && (
        // Listras indicam o excesso também sem depender da cor.
        <div
          aria-hidden
          className="absolute inset-0 rounded-full opacity-45"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 5px, var(--surface) 5px 8px)',
          }}
        />
      )}
    </div>
  );
}

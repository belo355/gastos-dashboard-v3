import type { BudgetState } from '../domain/types';

/**
 * Barra de progresso do orçamento. Dentro do limite ela usa a cor recebida (a da categoria);
 * acima do limite fica vermelha e listrada. A parte visual satura em 100% e o texto vem em
 * aria-valuetext.
 */
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
  /** Cor do preenchimento dentro do limite (ex.: a cor da categoria). */
  color: string;
}) {
  const pct = Math.round(ratio * 100);
  const width = Math.min(Math.max(ratio, 0), 1) * 100;
  const over = status === 'over';
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
        className="progress-fill h-full rounded-full"
        style={{ width: `${width}%`, background: over ? 'var(--danger)' : color }}
      />
      {over && (
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

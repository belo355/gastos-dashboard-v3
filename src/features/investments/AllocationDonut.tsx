import { getInvestmentType, type TypeTotal } from '../../domain/investments';
import { formatMoney } from '../../domain/money';
import { formatPercent } from '../../lib/format';
import { TypeIcon, typeColor } from './TypeIcon';

/**
 * Distribuição do patrimônio por tipo: rosca (decorativa) e a lista ao lado com nome,
 * percentual e valor — a lista é a fonte acessível dos números.
 */
export function AllocationDonut({ byType, headingId }: { byType: TypeTotal[]; headingId: string }) {
  const size = 148;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const visible = byType.filter((t) => t.valueCents > 0);
  const gap = visible.length > 1 ? 3 : 0;
  // Início de cada fatia ao longo do anel (soma das anteriores).
  const segments = visible.map((t, k) => ({
    t,
    len: (t.sharePercent / 100) * c,
    start: visible.slice(0, k).reduce((a, x) => a + (x.sharePercent / 100) * c, 0),
  }));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <h2 id={headingId} className="text-headline font-semibold">
        Distribuição por tipo
      </h2>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <svg
          aria-hidden
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="donut-in shrink-0 -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={stroke}
          />
          {segments.map(({ t, len, start }) => (
            <circle
              key={t.type}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={typeColor(t.type)}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              strokeDashoffset={-start}
            />
          ))}
        </svg>
        <ul className="flex w-full flex-col gap-2.5">
          {byType.map((t) => (
            <li key={t.type} className="flex items-center gap-3">
              <TypeIcon type={t.type} size={26} />
              <span className="min-w-0 flex-1 truncate text-subhead">
                {getInvestmentType(t.type).name}
              </span>
              <span className="figure text-subhead font-semibold">
                {formatPercent(Math.round(t.sharePercent * 10) / 10)}
              </span>
              <span className="figure w-28 text-right text-footnote text-muted">
                {formatMoney(t.valueCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

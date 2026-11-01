import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '../../domain/dates';
import {
  formatRate,
  getInvestmentType,
  type Position,
  type TypeTotal,
} from '../../domain/investments';
import { formatMoney } from '../../domain/money';
import { formatPercent, plural } from '../../lib/format';
import { GroupedList } from '../../ui/Grouped';
import { gainTone, signedPercent } from './format';
import { TypeIcon } from './TypeIcon';

/** Subtítulo do ativo: taxa, vencimento e de onde vem o valor. */
export function positionHint(p: Position): string {
  const parts: string[] = [];
  if (p.investment.rate) parts.push(formatRate(p.investment.rate));
  if (p.investment.maturity) parts.push(`vence ${formatDate(p.investment.maturity)}`);
  if (p.estimated) parts.push('estimado');
  else if (p.lastBalanceDate) parts.push(`saldo de ${formatDate(p.lastBalanceDate)}`);
  return parts.join(' · ');
}

/** "Meus ativos": um grupo por tipo, com o total do tipo e as linhas dos ativos. */
export function AssetGroups({
  positions,
  byType,
  headingId,
}: {
  positions: Position[];
  byType: TypeTotal[];
  headingId: string;
}) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="mt-3 px-1 text-title3 font-bold">
        Meus ativos <span className="font-normal text-muted">({positions.length})</span>
      </h2>
      {byType.map((t) => {
        const meta = getInvestmentType(t.type);
        const items = positions.filter((p) => p.investment.type === t.type);
        const ret = t.appliedCents > 0 ? (t.gainCents / t.appliedCents) * 100 : null;
        return (
          <GroupedList key={t.type} label={meta.name} testId="asset-group">
            <li className="flex items-center gap-3 bg-surface px-4 py-3">
              <TypeIcon type={t.type} size={36} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-headline font-semibold">{meta.name}</span>
                <span className="text-footnote text-muted">
                  {plural(t.count, 'ativo', 'ativos')} ·{' '}
                  {formatPercent(Math.round(t.sharePercent * 10) / 10)} da carteira
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="figure font-semibold">{formatMoney(t.valueCents)}</span>
                {ret !== null && (
                  <span className={`figure text-footnote font-semibold ${gainTone(t.gainCents)}`}>
                    {signedPercent(ret)}
                  </span>
                )}
              </span>
            </li>
            {items.map((p) => (
              <li key={p.investment.id}>
                <Link
                  to={`/investimentos/${p.investment.id}`}
                  data-testid="asset-row"
                  className="flex min-h-14 items-center pl-4 hover:bg-surface-2/60 active:bg-surface-2"
                >
                  <span className="row-body flex min-w-0 flex-1 items-center gap-3 self-stretch py-2.5 pr-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{p.investment.name}</span>
                      <span className="truncate text-footnote text-muted">{positionHint(p)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="figure font-semibold">{formatMoney(p.valueCents)}</span>
                      {p.returnPercent !== null && (
                        <span
                          className={`figure text-footnote font-semibold ${gainTone(p.gainCents)}`}
                        >
                          {signedPercent(p.returnPercent)}
                        </span>
                      )}
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
            ))}
          </GroupedList>
        );
      })}
    </section>
  );
}

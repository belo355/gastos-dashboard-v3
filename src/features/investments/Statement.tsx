import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { formatDate, formatMonthLabel } from '../../domain/dates';
import {
  chronological,
  ENTRY_LABEL,
  type EntryKind,
  type Investment,
  type InvestmentEntry,
} from '../../domain/investments';
import { formatMoney } from '../../domain/money';
import { Button } from '../../ui/Button';
import { TileIcon } from '../../ui/CategoryIcon';
import { GroupedList } from '../../ui/Grouped';
import { signedMoney } from './format';

const KIND_ICON: Record<EntryKind, { icon: typeof ArrowDownLeft; color: string }> = {
  aporte: { icon: ArrowDownLeft, color: 'var(--cat-mercado)' },
  resgate: { icon: ArrowUpRight, color: 'var(--cat-alimentacao)' },
  saldo: { icon: RefreshCw, color: 'var(--cat-outros)' },
};

const PAGE = 25;

/**
 * Extrato: cada entrada (aporte), saída (resgate) e saldo informado, do mais recente para o
 * mais antigo, agrupado por mês. Tocar numa linha abre a edição.
 */
export function Statement({
  entries,
  investments,
  onEdit,
  showInvestment = true,
  headingId,
}: {
  entries: readonly InvestmentEntry[];
  investments: readonly Investment[];
  onEdit: (entry: InvestmentEntry) => void;
  showInvestment?: boolean;
  headingId: string;
}) {
  const [limit, setLimit] = useState(PAGE);
  const names = useMemo(() => new Map(investments.map((i) => [i.id, i.name])), [investments]);
  const sorted = useMemo(() => [...entries].sort(chronological).reverse(), [entries]);
  const shown = sorted.slice(0, limit);

  const months: { month: string; items: InvestmentEntry[]; net: number }[] = [];
  for (const e of shown) {
    const last = months[months.length - 1];
    const delta = e.kind === 'aporte' ? e.amountCents : e.kind === 'resgate' ? -e.amountCents : 0;
    if (last && last.month === e.month) {
      last.items.push(e);
      last.net += delta;
    } else months.push({ month: e.month, items: [e], net: delta });
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="mt-3 px-1 text-title3 font-bold">
        Extrato
      </h2>
      {sorted.length === 0 && <p className="px-1 text-muted">Nenhuma movimentação ainda.</p>}
      {months.map((m) => (
        <div key={m.month} className="flex flex-col gap-1.5">
          <h3 className="flex items-baseline justify-between px-4 pt-2 text-footnote uppercase text-muted">
            <span>{formatMonthLabel(m.month)}</span>
            {m.net !== 0 && (
              <span className="figure normal-case">Aportes − resgates: {signedMoney(m.net)}</span>
            )}
          </h3>
          <GroupedList label={`Movimentações de ${formatMonthLabel(m.month)}`}>
            {m.items.map((e) => {
              const { icon: Icon, color } = KIND_ICON[e.kind];
              const name = names.get(e.investmentId) ?? 'Investimento excluído';
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    data-testid="statement-row"
                    onClick={() => onEdit(e)}
                    className="flex min-h-14 w-full items-center gap-3 pl-4 text-left hover:bg-surface-2/60 active:bg-surface-2"
                  >
                    <TileIcon size={30} color={color}>
                      <Icon aria-hidden size={18} strokeWidth={2.5} />
                    </TileIcon>
                    <span className="row-body flex min-w-0 flex-1 items-center gap-3 self-stretch py-2 pr-4">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">
                          {showInvestment ? name : ENTRY_LABEL[e.kind]}
                        </span>
                        <span className="truncate text-footnote text-muted">
                          {showInvestment ? `${ENTRY_LABEL[e.kind]} · ` : ''}
                          {formatDate(e.date)}
                          {e.note ? ` · ${e.note}` : ''}
                        </span>
                      </span>
                      <span
                        className={`figure shrink-0 font-semibold ${e.kind === 'resgate' ? 'text-danger' : e.kind === 'aporte' ? 'text-ok' : 'text-muted'}`}
                      >
                        {e.kind === 'saldo'
                          ? formatMoney(e.amountCents)
                          : signedMoney(e.kind === 'aporte' ? e.amountCents : -e.amountCents)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </GroupedList>
        </div>
      ))}
      {sorted.length > limit && (
        <Button
          variant="ghost"
          onClick={() => setLimit((l) => l + PAGE * 4)}
          className="self-center"
        >
          Mostrar mais ({sorted.length - limit})
        </Button>
      )}
    </section>
  );
}

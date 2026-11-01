import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { investmentRepository } from '../../data/investmentRepository';
import { formatDate } from '../../domain/dates';
import { buildPortfolio, formatRate, getInvestmentType } from '../../domain/investments';
import { formatMoney } from '../../domain/money';
import type { InvestmentsData } from '../../hooks/useInvestments';
import { errorMessage } from '../../lib/errors';
import { formatPercent } from '../../lib/format';
import { Button, IconButton } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { useToast } from '../app/Toaster';
import { gainTone, signedMoney, signedPercent } from './format';
import { useInvestmentActions } from './InvestmentActions';
import { Statement } from './Statement';
import { TypeIcon } from './TypeIcon';
import { WealthChart } from './WealthChart';

function Back() {
  return (
    <Link
      to="/investimentos"
      className="-ml-2.5 inline-flex min-h-11 w-fit items-center rounded-lg pr-2 text-body text-tint"
    >
      <ChevronLeft aria-hidden size={28} strokeWidth={2.5} /> Investimentos
    </Link>
  );
}

/** Detalhe de um investimento: valor, aplicado, ganho, evolução, ações e o extrato dele. */
export function AssetDetail({ data }: { data: InvestmentsData }) {
  const { id } = useParams();
  const actions = useInvestmentActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const position = data.portfolio.positions.find((p) => p.investment.id === id);
  const entries = useMemo(() => data.entries.filter((e) => e.investmentId === id), [data, id]);
  const own = useMemo(
    () => (position ? buildPortfolio([position.investment], entries, data.refs) : null),
    [position, entries, data.refs],
  );

  if (!position || !own) {
    return (
      <div className="flex flex-col gap-2">
        <Back />
        <EmptyState title="Investimento não encontrado">Ele pode ter sido excluído.</EmptyState>
      </div>
    );
  }

  const inv = position.investment;
  async function onDelete() {
    try {
      await investmentRepository.remove(inv.id);
      toast.show(`${inv.name} excluído`);
      navigate('/investimentos', { replace: true });
    } catch (e) {
      setConfirm(false);
      toast.show(errorMessage(e), { tone: 'danger' });
    }
  }

  const facts: [string, string][] = [
    ['Tipo', getInvestmentType(inv.type).name],
    ['Rentabilidade', inv.rate ? formatRate(inv.rate) : 'Sem taxa (só saldos informados)'],
  ];
  if (inv.maturity) facts.push(['Vencimento', formatDate(inv.maturity)]);
  facts.push(['Na carteira', formatPercent(Math.round(position.sharePercent * 10) / 10)]);

  return (
    <section aria-labelledby="asset-title" className="flex flex-col gap-3">
      <PageHeader
        id="asset-title"
        title={inv.name}
        leading={<Back />}
        trailing={
          <IconButton
            label="Editar investimento"
            icon={<Pencil aria-hidden size={20} strokeWidth={2.25} />}
            onClick={() => actions.editInvestment(inv)}
          />
        }
      />

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-4 rounded-2xl bg-surface p-4"
            data-testid="asset-summary"
          >
            <div className="flex items-center gap-3">
              <TypeIcon type={inv.type} size={40} />
              <div className="flex flex-col">
                <span className="figure text-title1 font-bold">
                  {formatMoney(position.valueCents)}
                </span>
                <span className="text-footnote text-muted">
                  {position.estimated
                    ? `Estimado pela taxa${position.lastBalanceDate ? ` desde o saldo de ${formatDate(position.lastBalanceDate)}` : ''}`
                    : position.lastBalanceDate
                      ? `Saldo informado em ${formatDate(position.lastBalanceDate)}`
                      : 'Aportes menos resgates'}
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-2 border-t border-separator pt-3">
              <div>
                <dt className="text-footnote text-muted">Aplicado</dt>
                <dd className="figure font-semibold">{formatMoney(position.appliedCents)}</dd>
              </div>
              <div>
                <dt className="text-footnote text-muted">Ganho</dt>
                <dd className={`figure font-semibold ${gainTone(position.gainCents)}`}>
                  {signedMoney(position.gainCents)}
                </dd>
              </div>
              <div>
                <dt className="text-footnote text-muted">Rentabilidade</dt>
                <dd className={`figure font-semibold ${gainTone(position.gainCents)}`}>
                  {position.returnPercent === null ? '—' : signedPercent(position.returnPercent)}
                </dd>
              </div>
            </dl>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                className="flex-col !gap-0.5 !px-2 !text-footnote"
                icon={<ArrowDownLeft aria-hidden size={20} strokeWidth={2.5} />}
                onClick={() => actions.newEntry({ investmentId: inv.id, kind: 'aporte' })}
              >
                Aportar
              </Button>
              <Button
                variant="secondary"
                className="flex-col !gap-0.5 !px-2 !text-footnote"
                icon={<ArrowUpRight aria-hidden size={20} strokeWidth={2.5} />}
                onClick={() => actions.newEntry({ investmentId: inv.id, kind: 'resgate' })}
              >
                Resgatar
              </Button>
              <Button
                variant="secondary"
                className="flex-col !gap-0.5 !px-2 !text-footnote"
                icon={<RefreshCw aria-hidden size={20} strokeWidth={2.5} />}
                onClick={() => actions.newEntry({ investmentId: inv.id, kind: 'saldo' })}
              >
                Informar saldo
              </Button>
            </div>
          </div>

          <dl className="grouped overflow-hidden rounded-2xl bg-surface">
            {facts.map(([k, v], i) => (
              <div
                key={k}
                className={`flex min-h-12 items-center justify-between gap-3 px-4 ${i > 0 ? 'border-t border-separator' : ''}`}
              >
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>

          <WealthChart history={own.history} headingId="asset-chart-title" title="Evolução" />
        </div>

        <div className="flex flex-col gap-3">
          <Statement
            entries={entries}
            investments={data.investments}
            onEdit={actions.editEntry}
            showInvestment={false}
            headingId="asset-statement-title"
          />
          <Button
            variant="ghost"
            icon={<Trash2 aria-hidden size={18} />}
            className="!text-danger self-center"
            onClick={() => setConfirm(true)}
          >
            Excluir investimento
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title={`Excluir ${inv.name}?`}
        description="O investimento e todas as movimentações dele serão apagados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => void onDelete()}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}

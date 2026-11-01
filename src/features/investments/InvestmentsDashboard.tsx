import { useState, type ReactNode } from 'react';
import { ChartLine, FlaskConical, Percent, Plus } from 'lucide-react';
import { createSampleInvestments } from '../../data/sampleInvestments';
import { investmentRepository } from '../../data/investmentRepository';
import { formatMoney } from '../../domain/money';
import type { InvestmentsData } from '../../hooks/useInvestments';
import { errorMessage } from '../../lib/errors';
import { Button, IconButton } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { useToast } from '../app/Toaster';
import { AllocationDonut } from './AllocationDonut';
import { AssetGroups } from './AssetGroups';
import { gainTone, signedMoney, signedPercent } from './format';
import { useInvestmentActions } from './InvestmentActions';
import { Statement } from './Statement';
import { WealthChart } from './WealthChart';

/** Painel de investimentos: indicadores, evolução mês a mês, distribuição, ativos e extrato. */
export function InvestmentsDashboard({ data }: { data: InvestmentsData }) {
  const actions = useInvestmentActions();
  const { portfolio } = data;
  const empty = data.investments.length === 0;

  return (
    <section aria-labelledby="inv-title" className="flex flex-col gap-3">
      <PageHeader
        id="inv-title"
        title="Investimentos"
        trailing={
          <>
            <IconButton
              label="Taxas de referência"
              icon={<Percent aria-hidden size={22} strokeWidth={2.25} />}
              onClick={actions.openRates}
            />
            {!empty && (
              <IconButton
                label="Cadastrar investimento"
                icon={<Plus aria-hidden size={24} strokeWidth={2.5} />}
                onClick={actions.newInvestment}
              />
            )}
          </>
        }
      />
      {data.hasSample && <SampleBanner />}
      {empty ? <Empty /> : <Content data={data} />}
      {!empty && portfolio.totals.valueCents === 0 && (
        <p className="px-1 text-footnote text-muted">Todos os investimentos estão zerados.</p>
      )}
    </section>
  );
}

function Content({ data }: { data: InvestmentsData }) {
  const actions = useInvestmentActions();
  const { portfolio } = data;
  const { totals, history } = portfolio;
  const prev = history[history.length - 2];
  const last = history[history.length - 1];
  const monthGain = last && prev ? last.gainCents - prev.gainCents : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="inv-kpis">
        <Kpi label="Patrimônio total" testId="kpi-patrimonio">
          <span className="figure text-title3 font-bold">{formatMoney(totals.valueCents)}</span>
          {totals.returnPercent !== null && (
            <span className={`figure text-footnote font-semibold ${gainTone(totals.gainCents)}`}>
              {signedPercent(totals.returnPercent)} sobre o aplicado
            </span>
          )}
        </Kpi>
        <Kpi label="Valor aplicado" testId="kpi-aplicado">
          <span className="figure text-title3 font-bold">{formatMoney(totals.appliedCents)}</span>
          <span className="text-footnote text-muted">Aportes menos resgates</span>
        </Kpi>
        <Kpi label="Ganho de capital" testId="kpi-ganho">
          <span className={`figure text-title3 font-bold ${gainTone(totals.gainCents)}`}>
            {signedMoney(totals.gainCents)}
          </span>
          <span className="text-footnote text-muted">Patrimônio − aplicado</span>
        </Kpi>
        <Kpi label="Ganho no mês" testId="kpi-mes">
          <span
            className={`figure text-title3 font-bold ${monthGain === null ? 'text-muted' : gainTone(monthGain)}`}
          >
            {monthGain === null ? '—' : signedMoney(monthGain)}
          </span>
          <span className="text-footnote text-muted">Variação do ganho desde o mês passado</span>
        </Kpi>
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start">
        <WealthChart history={history} headingId="inv-chart-title" />
        <AllocationDonut byType={portfolio.byType} headingId="inv-dist-title" />
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <AssetGroups
          positions={portfolio.positions}
          byType={portfolio.byType}
          headingId="inv-assets-title"
        />
        <Statement
          entries={data.entries}
          investments={data.investments}
          onEdit={actions.editEntry}
          headingId="inv-statement-title"
        />
      </div>
    </div>
  );
}

function Kpi({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-surface p-4" data-testid={testId}>
      <span className="text-footnote font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}

function Empty() {
  const actions = useInvestmentActions();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function sample() {
    setBusy(true);
    try {
      await createSampleInvestments();
    } catch (e) {
      toast.show(errorMessage(e), { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <EmptyState
      icon={<ChartLine size={56} strokeWidth={1.5} aria-hidden />}
      title="Acompanhe seus investimentos"
      action={
        <div className="flex flex-col items-center gap-2">
          <Button onClick={actions.newInvestment}>Cadastrar investimento</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void sample()}>
            Ver um exemplo com dados fictícios
          </Button>
        </div>
      }
    >
      Cadastre o que você já tem e lance aportes e resgates. O app mostra quanto do patrimônio é
      dinheiro aplicado e quanto é ganho, mês a mês. Tudo fica só neste aparelho.
    </EmptyState>
  );
}

function SampleBanner() {
  const toast = useToast();
  async function remove() {
    try {
      await investmentRepository.removeSamples();
      toast.show('Exemplo apagado');
    } catch (e) {
      toast.show(errorMessage(e), { tone: 'danger' });
    }
  }
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl bg-warning-bg px-4 py-3 text-subhead"
      data-testid="inv-sample-banner"
    >
      <FlaskConical aria-hidden size={20} className="shrink-0 text-warning" />
      <span className="min-w-0 flex-1">
        <strong className="font-semibold">Exemplo · dados fictícios.</strong>
      </span>
      <button
        type="button"
        onClick={() => void remove()}
        className="min-h-11 rounded-full px-3 font-semibold text-tint"
      >
        Apagar exemplo
      </button>
    </div>
  );
}

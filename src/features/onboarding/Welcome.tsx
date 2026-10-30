import { useState } from 'react';
import { ChartPie, Plus, ShieldCheck, Target } from 'lucide-react';
import { createSampleWallet } from '../../data/sampleData';
import { settingsRepository } from '../../data/settingsRepository';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';

const STEPS = [
  {
    icon: <Plus aria-hidden size={44} strokeWidth={2.5} />,
    title: 'Lance seus gastos em segundos',
    text: 'Toque em Lançar, digite o valor e escolha a categoria. Pronto.',
  },
  {
    icon: <ChartPie aria-hidden size={44} />,
    title: 'Veja para onde vai o dinheiro',
    text: 'O resumo mostra o total do mês e quanto cada categoria representa, do maior para o menor gasto.',
  },
  {
    icon: <Target aria-hidden size={44} />,
    title: 'Defina limites e acompanhe',
    text: 'Escolha quanto quer gastar por categoria e receba um aviso quando estiver perto do limite.',
  },
];

/** Boas-vindas em até 3 passos, com o aviso de privacidade e a opção de ver um exemplo. */
export function Welcome() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = step === STEPS.length - 1;
  const current = STEPS[step]!;

  async function finish(withSample: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (withSample) await createSampleWallet();
      await settingsRepository.update({ onboardingDone: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        Passo {step + 1} de {STEPS.length}
      </p>
      <section
        aria-labelledby="welcome-title"
        className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg">
          {current.icon}
        </div>
        <h1 id="welcome-title" className="text-3xl font-extrabold">
          {current.title}
        </h1>
        <p className="text-lg text-muted">{current.text}</p>
      </section>

      <div
        className="flex gap-3 rounded-2xl border-2 border-border bg-surface p-4"
        data-testid="privacy-notice"
      >
        <ShieldCheck aria-hidden className="shrink-0 text-ok" />
        <p className="text-sm">
          <strong>Seus dados ficam só neste aparelho.</strong> Não há conta nem servidor. Se você
          limpar os dados do navegador, os gastos são apagados — por isso, exporte uma planilha de
          vez em quando.
        </p>
      </div>

      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}

      {last ? (
        <div className="flex flex-col gap-2">
          <Button block disabled={busy} onClick={() => void finish(false)}>
            Começar vazio
          </Button>
          <Button block variant="secondary" disabled={busy} onClick={() => void finish(true)}>
            Ver um exemplo com dados fictícios
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setStep(STEPS.length - 1)}>
            Pular
          </Button>
          <Button block onClick={() => setStep(step + 1)}>
            Próximo
          </Button>
        </div>
      )}
    </main>
  );
}

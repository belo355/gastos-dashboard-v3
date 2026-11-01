import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { ChartLine, ChartPie, Check, Ellipsis, List, Plus, Target } from 'lucide-react';
import { SAVED_EVENT } from '../../hooks/useSaveExpense';
import { useExpenseForm } from '../expenses/ExpenseFormContext';
import { INVESTMENT_LAUNCH_EVENT } from '../investments/InvestmentActions';
import { SaveCelebration } from './SaveCelebration';

const NAV = [
  { to: '/', label: 'Resumo', icon: ChartPie, end: true },
  { to: '/lancamentos', label: 'Lançamentos', icon: List, end: false },
  { to: '/investimentos', label: 'Investimentos', icon: ChartLine, end: false },
  { to: '/orcamento', label: 'Orçamento', icon: Target, end: false },
  { to: '/mais', label: 'Mais', icon: Ellipsis, end: false },
];

/** Recompensa visual: o botão Lançar "pulsa" e mostra um check logo depois de salvar. */
function useSavedPulse(ms = 900) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSaved = () => {
      setPulse((p) => p + 1);
      clearTimeout(timer);
      timer = setTimeout(() => setPulse(0), ms);
    };
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => {
      window.removeEventListener(SAVED_EVENT, onSaved);
      clearTimeout(timer);
    };
  }, [ms]);
  return pulse;
}

/** true depois que a página rolou um pouco: o botão Lançar recolhe para não cobrir o conteúdo. */
function useScrolled(threshold = 48) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function AppShell() {
  const form = useExpenseForm();
  const pulse = useSavedPulse();
  const scrolled = useScrolled();
  const compact = scrolled && !pulse;
  const { pathname } = useLocation();
  // Resumo e Investimentos usam duas colunas em telas largas; as demais mantêm a coluna de leitura.
  const investing = pathname.startsWith('/investimentos');
  const wide = pathname === '/' || investing;
  // Na aba Investimentos, "Lançar" abre o lançamento de investimento.
  const launch = () =>
    investing ? window.dispatchEvent(new Event(INVESTMENT_LAUNCH_EVENT)) : form.openNew();
  return (
    <div className={`mx-auto flex min-h-dvh max-w-2xl flex-col ${wide ? 'lg:max-w-5xl' : ''}`}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" className="flex-1 px-4 pb-44 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>

      <button
        type="button"
        data-testid="launch-button"
        aria-label="Lançar"
        onClick={launch}
        className={`press fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-21rem))] z-40 inline-flex min-h-14 min-w-14 items-center justify-center rounded-full ${wide ? 'lg:right-[max(1rem,calc(50%-31rem))]' : ''} ${compact ? 'px-4' : 'gap-2 pl-5 pr-6'} text-headline font-semibold shadow-[0_10px_28px_-8px_rgb(0_0_0/0.45)] hover:brightness-110 ${
          pulse ? 'launch-pop bg-ok text-surface' : 'bg-primary text-primary-ink'
        }`}
      >
        {pulse ? (
          <Check aria-hidden size={22} strokeWidth={3} />
        ) : (
          <Plus aria-hidden size={22} strokeWidth={3} />
        )}
        <span aria-hidden className={compact ? 'sr-only' : ''}>
          {pulse ? 'Salvo!' : 'Lançar'}
        </span>
      </button>

      <SaveCelebration />

      <nav
        aria-label="Navegação principal"
        className="material fixed inset-x-0 bottom-0 z-30 border-t border-separator pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                viewTransition
                className={({ isActive }) =>
                  `flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 pt-1.5 text-caption2 font-medium ${isActive ? 'text-tint' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon aria-hidden size={25} strokeWidth={isActive ? 2.5 : 1.9} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

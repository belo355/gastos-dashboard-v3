import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { ChartPie, Check, Ellipsis, List, Plus, Target } from 'lucide-react';
import { SAVED_EVENT } from '../../hooks/useSaveExpense';
import { useExpenseForm } from '../expenses/ExpenseFormContext';

const NAV = [
  { to: '/', label: 'Resumo', icon: ChartPie, end: true },
  { to: '/lancamentos', label: 'Lançamentos', icon: List, end: false },
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

export function AppShell() {
  const form = useExpenseForm();
  const pulse = useSavedPulse();
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
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
        onClick={form.openNew}
        className={`press fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-21rem))] z-40 inline-flex min-h-14 items-center gap-2 rounded-full pl-5 pr-6 text-headline font-semibold shadow-[0_10px_28px_-8px_rgb(0_0_0/0.45)] hover:brightness-110 ${
          pulse ? 'launch-pop bg-ok text-surface' : 'bg-primary text-primary-ink'
        }`}
      >
        {pulse ? (
          <Check aria-hidden size={22} strokeWidth={3} />
        ) : (
          <Plus aria-hidden size={22} strokeWidth={3} />
        )}
        <span aria-hidden>{pulse ? 'Salvo!' : 'Lançar'}</span>
      </button>

      <nav
        aria-label="Navegação principal"
        className="material fixed inset-x-0 bottom-0 z-30 border-t border-separator pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
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

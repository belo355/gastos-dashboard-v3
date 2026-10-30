import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router';
import { openDatabase } from './data/storageGuard';
import { settingsRepository } from './data/settingsRepository';
import { AppShell } from './features/app/AppShell';
import { AppStateProvider, useAppState } from './features/app/AppState';
import { UpdatePrompt } from './features/app/UpdatePrompt';
import { ErrorBoundary } from './features/app/ErrorBoundary';
import { StorageErrorScreen } from './features/app/StorageErrorScreen';
import { ToastProvider } from './features/app/Toaster';
import { ExpenseFormProvider } from './features/expenses/ExpenseFormContext';
import { ExpensesPage } from './features/expenses/ExpenseList';
import { SummaryPage } from './features/summary/SummaryPage';

// O Resumo e os Lançamentos vêm na primeira carga; as demais telas são baixadas quando abertas.
const BudgetPage = lazy(() =>
  import('./features/budget/BudgetPage').then((m) => ({ default: m.BudgetPage })),
);
const MorePage = lazy(() =>
  import('./features/settings/MorePage').then((m) => ({ default: m.MorePage })),
);
const Welcome = lazy(() =>
  import('./features/onboarding/Welcome').then((m) => ({ default: m.Welcome })),
);
import { errorMessage } from './lib/errors';

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted" aria-busy="true">
      Carregando…
    </div>
  );
}

/** Abre o banco e garante a carteira padrão antes de mostrar o app. */
function Boot({ children }: { children: ReactNode }) {
  const [state, setState] = useState<
    { status: 'loading' | 'ready' } | { status: 'error'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    openDatabase()
      .then(() => settingsRepository.ensureInitialized())
      .then(() => alive && setState({ status: 'ready' }))
      .catch((e: unknown) => alive && setState({ status: 'error', message: errorMessage(e) }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === 'error') return <StorageErrorScreen message={state.message} />;
  if (state.status === 'loading') return <Loading />;
  return <>{children}</>;
}

/** No primeiro uso (ou depois de apagar os dados), mostra as boas-vindas. */
function OnboardingGate({ children }: { children: ReactNode }) {
  const { settings } = useAppState();
  return settings.onboardingDone ? (
    <>{children}</>
  ) : (
    <Suspense fallback={<Loading />}>
      <Welcome />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<SummaryPage />} />
        <Route path="lancamentos" element={<ExpensesPage />} />
        <Route
          path="orcamento"
          element={
            <Suspense fallback={<Loading />}>
              <BudgetPage />
            </Suspense>
          }
        />
        <Route
          path="mais/*"
          element={
            <Suspense fallback={<Loading />}>
              <MorePage />
            </Suspense>
          }
        />
        <Route path="*" element={<SummaryPage />} />
      </Route>
    </Routes>
  );
}

/** `initialPath` usa um roteador em memória (testes). */
export function App({ initialPath }: { initialPath?: string }) {
  const content = (
    <ToastProvider>
      <Boot>
        <AppStateProvider fallback={<Loading />}>
          <OnboardingGate>
            <ExpenseFormProvider>
              <AppRoutes />
            </ExpenseFormProvider>
          </OnboardingGate>
        </AppStateProvider>
        <UpdatePrompt />
      </Boot>
    </ToastProvider>
  );
  return (
    <ErrorBoundary>
      {initialPath ? (
        <MemoryRouter initialEntries={[initialPath]}>{content}</MemoryRouter>
      ) : (
        <BrowserRouter>{content}</BrowserRouter>
      )}
    </ErrorBoundary>
  );
}

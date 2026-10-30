import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { settingsRepository } from '../../data/settingsRepository';
import { currentMonth } from '../../domain/dates';
import type { MonthKey, Settings, Wallet } from '../../domain/types';

interface AppStateValue {
  settings: Settings;
  wallets: Wallet[];
  activeWallet: Wallet;
  month: MonthKey;
  setMonth: (month: MonthKey) => void;
  setActiveWallet: (walletId: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const settings = useLiveQuery(() => db.settings.get('app'), [], null);
  const wallets = useLiveQuery(() => db.wallets.orderBy('createdAt').toArray(), [], null);
  const [month, setMonth] = useState<MonthKey>(() => currentMonth());

  const activeWallet =
    settings && wallets ? wallets.find((w) => w.id === settings.activeWalletId) : undefined;

  // Sem preferências ou sem carteira ativa (primeiro uso, carteira excluída, dados apagados):
  // recria o estado mínimo.
  const needsInit = settings !== null && wallets !== null && !activeWallet;
  useEffect(() => {
    if (needsInit) void settingsRepository.ensureInitialized();
  }, [needsInit]);

  const setActiveWallet = useCallback(
    (walletId: string) => settingsRepository.setActiveWallet(walletId),
    [],
  );

  const value = useMemo<AppStateValue | null>(
    () =>
      settings && wallets && activeWallet
        ? { settings, wallets, activeWallet, month, setMonth, setActiveWallet }
        : null,
    [settings, wallets, activeWallet, month, setActiveWallet],
  );

  if (!value) return <>{fallback}</>;
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState fora do AppStateProvider');
  return ctx;
}

import { useAppState } from '../features/app/AppState';

export function useActiveWallet() {
  const { activeWallet, wallets, setActiveWallet } = useAppState();
  return { wallet: activeWallet, wallets, setActiveWallet };
}

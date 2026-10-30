import { Link } from 'react-router';
import { Settings2, WalletMinimal } from 'lucide-react';
import { useActiveWallet } from '../../hooks/useActiveWallet';

/** Troca a carteira ativa em um toque. */
export function WalletSwitcher() {
  const { wallet, wallets, setActiveWallet } = useActiveWallet();
  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Carteira ativa"
        className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1"
      >
        {wallets.map((w) => {
          const active = w.id === wallet.id;
          return (
            <button
              key={w.id}
              type="button"
              aria-pressed={active}
              data-testid="wallet-chip"
              onClick={() => !active && void setActiveWallet(w.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold ${
                active
                  ? 'border-primary bg-primary text-primary-ink'
                  : 'border-border bg-surface text-text hover:bg-surface-2'
              }`}
            >
              <WalletMinimal aria-hidden size={16} />
              {w.name}
              {w.isSample && (
                <span className="rounded-full bg-surface-2 px-2 text-xs text-text">Exemplo</span>
              )}
            </button>
          );
        })}
      </div>
      <Link
        to="/mais/carteiras"
        aria-label="Gerenciar carteiras"
        title="Gerenciar carteiras"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-surface-2"
      >
        <Settings2 aria-hidden size={20} />
      </Link>
    </div>
  );
}

import { Link } from 'react-router';
import { Settings2, WalletMinimal } from 'lucide-react';
import { useActiveWallet } from '../../hooks/useActiveWallet';

/** Troca a carteira ativa em um toque (cápsulas, como os filtros do app Fotos). */
export function WalletSwitcher() {
  const { wallet, wallets, setActiveWallet } = useActiveWallet();
  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Carteira ativa"
        className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]"
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
              className={`press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-subhead font-semibold ${
                active ? 'bg-text text-surface' : 'bg-surface text-text hover:bg-surface-2'
              }`}
            >
              <WalletMinimal aria-hidden size={16} strokeWidth={2.25} />
              {w.name}
              {w.isSample && (
                <span
                  className={`rounded-full px-2 text-caption font-semibold ${
                    active ? 'bg-surface text-text' : 'bg-surface-2 text-text'
                  }`}
                >
                  fictício
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Link
        to="/mais/carteiras"
        aria-label="Gerenciar carteiras"
        title="Gerenciar carteiras"
        className="press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tint hover:bg-surface-2"
      >
        <Settings2 aria-hidden size={22} />
      </Link>
    </div>
  );
}

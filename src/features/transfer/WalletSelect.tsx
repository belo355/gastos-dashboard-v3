import { useId } from 'react';
import type { Wallet } from '../../domain/types';

/**
 * Escolha de carteira como grupo de opções (radio). Evita o <select> nativo, que em alguns
 * WebKit injeta estilos internos bloqueados pela CSP estrita do app.
 */
export function WalletSelect({
  wallets,
  value,
  onChange,
  label,
}: {
  wallets: Wallet[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {wallets.map((w) => (
          <label key={w.id} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={w.id}
              checked={w.id === value}
              onChange={() => onChange(w.id)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-full border-2 border-border bg-surface px-4 text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
              {w.name}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

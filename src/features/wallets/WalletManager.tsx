import { useId, useState, type FormEvent } from 'react';
import { Check, Pencil, Trash2, WalletMinimal } from 'lucide-react';
import { walletRepository } from '../../data/walletRepository';
import { WALLET_NAME_MAX } from '../../domain/walletName';
import type { Wallet } from '../../domain/types';
import { useActiveWallet } from '../../hooks/useActiveWallet';
import { errorMessage } from '../../lib/errors';
import { Button, IconButton } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { FieldError, inputClass } from '../../ui/Field';
import { Modal } from '../../ui/Sheet';
import { useToast } from '../app/Toaster';

export function WalletManager() {
  const { wallet: active, wallets, setActiveWallet } = useActiveWallet();
  const toast = useToast();
  const ids = { name: useId(), err: useId() };
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Wallet | null>(null);
  const [removing, setRemoving] = useState<Wallet | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const w = await walletRepository.create(name);
      setName('');
      toast.show(`Carteira "${w.name}" criada`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function onRemove() {
    if (!removing) return;
    const w = removing;
    setRemoving(null);
    try {
      await walletRepository.remove(w.id);
      toast.show(`Carteira "${w.name}" excluída`);
    } catch (err) {
      toast.show(errorMessage(err), { tone: 'danger' });
    }
  }

  return (
    <section aria-labelledby="cart-title" className="flex flex-col gap-4">
      <h1 id="cart-title" className="text-large-title font-bold">
        Carteiras
      </h1>
      <p className="text-muted">
        Separe seus gastos por contexto, como Pessoal, Casa ou Viagem. Cada carteira tem seus
        próprios lançamentos e orçamentos.
      </p>

      <form
        noValidate
        onSubmit={onCreate}
        className="flex flex-col gap-2 rounded-2xl bg-surface p-4"
      >
        <label htmlFor={ids.name} className="font-semibold">
          Nova carteira
        </label>
        <div className="flex gap-2">
          <input
            id={ids.name}
            className={inputClass}
            value={name}
            maxLength={WALLET_NAME_MAX + 10}
            placeholder="Ex.: Viagem"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? ids.err : undefined}
          />
          <Button type="submit">Criar</Button>
        </div>
        <FieldError id={ids.err}>{error}</FieldError>
      </form>

      <ul aria-label="Suas carteiras" className="flex flex-col gap-2">
        {wallets.map((w) => {
          const isActive = w.id === active.id;
          return (
            <li
              key={w.id}
              className="flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4"
              data-testid="wallet-item"
            >
              <WalletMinimal aria-hidden size={20} className="text-tint" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{w.name}</span>
                {w.isSample && (
                  <span className="text-xs text-muted">Exemplo · dados fictícios</span>
                )}
                {isActive && <span className="text-xs font-semibold text-ok">Ativa</span>}
              </span>
              {!isActive && (
                <Button
                  variant="secondary"
                  icon={<Check aria-hidden size={16} />}
                  onClick={() => void setActiveWallet(w.id)}
                  aria-label={`Usar a carteira ${w.name}`}
                >
                  Usar
                </Button>
              )}
              <IconButton
                label={`Renomear ${w.name}`}
                icon={<Pencil aria-hidden size={18} />}
                onClick={() => setRenaming(w)}
              />
              <IconButton
                label={`Excluir ${w.name}`}
                icon={<Trash2 aria-hidden size={18} />}
                className="!text-danger"
                onClick={() => setRemoving(w)}
              />
            </li>
          );
        })}
      </ul>

      <RenameDialog wallet={renaming} onClose={() => setRenaming(null)} />
      <ConfirmDialog
        open={removing !== null}
        title={`Excluir a carteira "${removing?.name ?? ''}"?`}
        description="Todos os lançamentos e orçamentos dela serão apagados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir carteira"
        destructive
        onConfirm={onRemove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}

function RenameDialog({ wallet, onClose }: { wallet: Wallet | null; onClose: () => void }) {
  return (
    <Modal open={wallet !== null} title="Renomear carteira" onClose={onClose} placement="center">
      {wallet && <RenameForm key={wallet.id} wallet={wallet} onClose={onClose} />}
    </Modal>
  );
}

function RenameForm({ wallet, onClose }: { wallet: Wallet; onClose: () => void }) {
  const ids = { name: useId(), err: useId() };
  const [name, setName] = useState(wallet.name);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await walletRepository.rename(wallet.id, name);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor={ids.name} className="font-semibold">
        Nome
      </label>
      <input
        id={ids.name}
        data-autofocus
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? ids.err : undefined}
      />
      <FieldError id={ids.err}>{error}</FieldError>
      <Button type="submit">Salvar</Button>
    </form>
  );
}

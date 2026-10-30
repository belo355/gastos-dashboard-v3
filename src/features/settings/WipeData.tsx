import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { settingsRepository } from '../../data/settingsRepository';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';

export function WipeData() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onWipe() {
    setBusy(true);
    try {
      await settingsRepository.wipeAll();
      setConfirm(false);
      // O app recria a carteira padrão e volta às boas-vindas.
      navigate('/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <section aria-labelledby="wipe-title" className="flex flex-col gap-4">
      <h1 id="wipe-title" className="text-2xl font-bold">
        Apagar do aparelho
      </h1>
      <p>
        Remove todas as carteiras, lançamentos e orçamentos salvos neste aparelho e volta o app ao
        primeiro uso.
      </p>
      <p className="font-semibold">
        Essa ação não pode ser desfeita. Se quiser guardar seus dados, exporte as planilhas antes.
      </p>
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
      <Button
        variant="danger"
        icon={<Trash2 aria-hidden size={18} />}
        onClick={() => setConfirm(true)}
      >
        Apagar do aparelho
      </Button>
      <ConfirmDialog
        open={confirm}
        title="Apagar todos os dados?"
        description="Todas as carteiras, lançamentos e orçamentos deste aparelho serão removidos. Essa ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        destructive
        busy={busy}
        onConfirm={() => void onWipe()}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}

import { Button } from './Button';
import { Modal } from './Sheet';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Alerta de confirmação no estilo do iOS: ação principal em cima, Cancelar embaixo. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      role="alertdialog"
      placement="center"
    >
      <div className="flex flex-col gap-2">
        <Button
          variant={destructive ? 'danger' : 'primary'}
          block
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" block onClick={onCancel} data-autofocus>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}

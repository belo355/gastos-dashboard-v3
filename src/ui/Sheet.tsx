import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  role?: 'dialog' | 'alertdialog';
  /** "sheet" sobe da base no celular; "center" é um diálogo centralizado. */
  placement?: 'sheet' | 'center';
  description?: string;
}

/** Modal acessível: foco preso, Esc fecha e o foco volta para quem abriu. */
export function Modal({
  open,
  title,
  onClose,
  children,
  role = 'dialog',
  placement = 'sheet',
  description,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    // Foca o elemento com autoFocus, senão o primeiro focável.
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    node?.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      node?.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const panelClass =
    placement === 'sheet'
      ? 'mt-auto w-full max-w-lg rounded-t-3xl sm:m-auto sm:rounded-3xl'
      : 'm-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex bg-black/50"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`sheet-panel flex max-h-[92dvh] flex-col overflow-y-auto bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ${panelClass}`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          {role === 'dialog' && (
            <IconButton
              label="Fechar"
              icon={<X aria-hidden size={22} />}
              onClick={onClose}
              className="-mr-2 -mt-2"
            />
          )}
        </div>
        {description && (
          <p id={descId} className="mb-4 text-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

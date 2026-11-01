import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
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

/**
 * No iPhone, o teclado não encolhe o layout: só a área visível (visualViewport). Um overlay
 * `fixed inset-0` continua com a altura da tela inteira e a sheet, presa ao fundo, fica atrás
 * do teclado. Aqui o overlay acompanha a área visível, então a sheet sobe junto com o teclado,
 * e o campo em foco é rolado para dentro da sheet se ainda estiver escondido.
 */
function useKeyboardAwareOverlay(
  open: boolean,
  overlay: RefObject<HTMLDivElement | null>,
  panel: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const vv = window.visualViewport;
    const el = overlay.current;
    if (!open || !vv || !el) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.top = `${vv.offsetTop}px`;
        el.style.height = `${vv.height}px`;
        el.style.bottom = 'auto';
        const active = document.activeElement;
        if (active instanceof HTMLElement && panel.current?.contains(active)) {
          active.scrollIntoView({ block: 'nearest' });
        }
      });
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      el.style.top = el.style.height = el.style.bottom = '';
    };
  }, [open, overlay, panel]);
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
  const overlay = useRef<HTMLDivElement>(null);
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
    // Sem rolar a página: no iOS, o foco num campo dentro de um elemento fixo faz a página "pular".
    target?.focus({ preventScroll: true });

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

  useKeyboardAwareOverlay(open, overlay, panel);

  if (!open) return null;

  const isSheet = placement === 'sheet';
  // Sheet: sobe da base, cantos grandes e alça, como as sheets do iOS.
  // Center: alerta compacto e centralizado, como o UIAlertController.
  const panelClass = isSheet
    ? 'sheet-panel mt-auto w-full max-w-lg rounded-t-[1.75rem] px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:m-auto sm:rounded-[1.75rem] sm:pb-5'
    : 'alert-panel m-auto w-[calc(100%-3rem)] max-w-xs rounded-[1.5rem] p-5 text-center';

  return createPortal(
    <div
      ref={overlay}
      className="scrim fixed inset-0 z-50 flex bg-scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`flex max-h-[92%] flex-col overflow-y-auto bg-surface shadow-[0_-8px_40px_-12px_rgb(0_0_0/0.35)] ${panelClass}`}
      >
        {isSheet && (
          <span aria-hidden className="mx-auto mb-2 h-[5px] w-9 shrink-0 rounded-full bg-border" />
        )}
        <div
          className={`flex gap-2 ${isSheet ? 'mb-4 items-center justify-between' : 'mb-1 justify-center'}`}
        >
          <h2
            id={titleId}
            className={isSheet ? 'text-title2 font-bold' : 'text-headline font-semibold'}
          >
            {title}
          </h2>
          {role === 'dialog' && (
            <IconButton
              label="Fechar"
              tone="filled"
              icon={<X aria-hidden size={30} strokeWidth={2.75} />}
              onClick={onClose}
              className="-mr-2"
            />
          )}
        </div>
        {description && (
          <p id={descId} className={isSheet ? 'mb-4 text-muted' : 'mb-5 text-footnote text-text'}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

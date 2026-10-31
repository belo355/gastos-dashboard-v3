import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (
    message: string,
    options?: { tone?: ToastTone; action?: Toast['action']; durationMs?: number },
  ) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CircleCheck aria-hidden className="text-ok" size={22} />;
  if (tone === 'warning' || tone === 'danger')
    return (
      <TriangleAlert
        aria-hidden
        className={tone === 'warning' ? 'text-warning' : 'text-danger'}
        size={22}
      />
    );
  return <Info aria-hidden className="text-tint" size={22} />;
}

/** Avisos curtos. Ficam em regiões aria-live: "polite" para confirmações, "assertive" para alertas. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback<ToastApi['show']>(
    (message, options) => {
      const id = ++seq.current;
      const tone = options?.tone ?? 'success';
      setToasts((t) => [...t.slice(-2), { id, message, tone, action: options?.action }]);
      const duration = options?.durationMs ?? (options?.action ? 10_000 : 4_500);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  const render = (list: Toast[]) =>
    list.map((t) => (
      <div
        key={t.id}
        className="toast pointer-events-auto bg-surface flex items-center gap-3 rounded-[1.375rem] py-2 pl-4 pr-1 text-text shadow-[0_12px_32px_-10px_rgb(0_0_0/0.35)] ring-1 ring-separator"
      >
        <ToneIcon tone={t.tone} />
        <p className="flex-1 text-subhead font-semibold">{t.message}</p>
        {t.action && (
          <button
            type="button"
            className="press min-h-9 rounded-full bg-primary px-4 text-subhead font-semibold text-primary-ink"
            onClick={() => {
              t.action!.onClick();
              dismiss(t.id);
            }}
          >
            {t.action.label}
          </button>
        )}
        <button
          type="button"
          aria-label="Fechar aviso"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
          onClick={() => dismiss(t.id)}
        >
          <X aria-hidden size={18} />
        </button>
      </div>
    ));

  const urgent = toasts.filter((t) => t.tone === 'warning' || t.tone === 'danger');
  const calm = toasts.filter((t) => t.tone === 'success' || t.tone === 'info');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex max-w-lg flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div role="alert" aria-live="assertive" className="flex flex-col gap-2">
          {render(urgent)}
        </div>
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {render(calm)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
}

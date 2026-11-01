import { useRef, type KeyboardEvent } from 'react';

/**
 * Controle segmentado do iOS (UISegmentedControl): opções lado a lado, a escolhida em destaque.
 * Semântica de grupo de rádio: Tab entra na opção marcada e as setas trocam.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex rounded-[0.625rem] bg-surface-2 p-0.5 ${className}`}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`min-h-9 flex-1 rounded-lg px-2 text-subhead whitespace-nowrap transition-colors ${
              checked
                ? 'bg-surface font-semibold text-text shadow-[0_1px_3px_rgb(0_0_0/0.14)]'
                : 'font-medium text-muted hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

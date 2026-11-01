import { useRef, type KeyboardEvent } from 'react';
import { INVESTMENT_TYPE_LIST, type InvestmentTypeId } from '../../domain/investments';
import { TypeIcon } from './TypeIcon';

/** Grade de tipos de investimento com ícone e nome (grupo de rádio; setas navegam). */
export function TypePicker({
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid,
}: {
  value: InvestmentTypeId | null;
  onChange: (id: InvestmentTypeId) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = INVESTMENT_TYPE_LIST.findIndex((t) => t.id === value);
  const tabStop = selected >= 0 ? selected : 0;

  function onKeyDown(e: KeyboardEvent, index: number) {
    const cols = 4;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const n = INVESTMENT_TYPE_LIST.length;
    const next = (index + delta + n) % n;
    refs.current[next]?.focus();
    onChange(INVESTMENT_TYPE_LIST[next]!.id);
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={`grid grid-cols-4 gap-1.5 rounded-2xl ${invalid ? 'outline-2 outline-offset-4 outline-danger' : ''}`}
    >
      {INVESTMENT_TYPE_LIST.map((t, i) => {
        const checked = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`press flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-center text-caption leading-tight ${
              checked
                ? 'bg-tint-fill font-semibold text-tint ring-2 ring-tint'
                : 'font-medium text-text hover:bg-surface-2'
            }`}
          >
            <TypeIcon type={t.id} size={36} />
            <span>{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}

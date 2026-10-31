import { useRef, type KeyboardEvent } from 'react';
import { CATEGORIES, type CategoryId } from '../../domain/categories';
import { CategoryBadge } from '../../ui/CategoryIcon';

interface Props {
  value: CategoryId | null;
  onChange: (id: CategoryId) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
}

/** Grade de categorias com ícone e nome; segue o padrão de radiogroup (setas navegam). */
export function CategoryPicker({ value, onChange, labelledBy, describedBy, invalid }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = CATEGORIES.findIndex((c) => c.id === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  function onKeyDown(e: KeyboardEvent, index: number) {
    const cols = 4;
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
    };
    const delta = moves[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = (index + delta + CATEGORIES.length) % CATEGORIES.length;
    refs.current[next]?.focus();
    onChange(CATEGORIES[next]!.id);
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={`grid grid-cols-4 gap-1.5 rounded-2xl ${invalid ? 'outline-2 outline-offset-4 outline-danger' : ''}`}
    >
      {CATEGORIES.map((c, i) => {
        const selected = c.id === value;
        return (
          <button
            key={c.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(c.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`press flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2 text-caption leading-tight ${
              selected
                ? 'bg-tint-fill font-semibold text-tint ring-2 ring-tint'
                : 'font-medium text-text hover:bg-surface-2'
            }`}
          >
            <CategoryBadge id={c.id} size={40} />
            <span>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

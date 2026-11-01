import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Check, Moon, Sun, SunMoon } from 'lucide-react';
import { setTheme, useTheme, type ThemePref } from '../../lib/theme';
import { TileIcon } from '../../ui/CategoryIcon';
import { GroupedList, SectionFooter } from '../../ui/Grouped';

const ICON = { size: 18, strokeWidth: 2.25, 'aria-hidden': true } as const;

const OPTIONS: { value: ThemePref; label: string; icon: ReactNode; color: string }[] = [
  { value: 'system', label: 'Automático', icon: <SunMoon {...ICON} />, color: 'var(--cat-outros)' },
  { value: 'light', label: 'Claro', icon: <Sun {...ICON} />, color: 'var(--cat-alimentacao)' },
  { value: 'dark', label: 'Escuro', icon: <Moon {...ICON} />, color: 'var(--cat-educacao)' },
];

/**
 * Escolha do tema, como uma lista de seleção dos Ajustes do iOS: a opção marcada leva um check.
 * Semântica de grupo de rádio: Tab entra no item marcado e as setas trocam a opção.
 */
export function AppearanceSection() {
  const theme = useTheme();
  const titleId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    setTheme(OPTIONS[next]!.value);
    refs.current[next]?.focus();
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="px-4 text-footnote uppercase text-muted">
        Aparência
      </h2>
      <div role="radiogroup" aria-labelledby={titleId}>
        <GroupedList>
          {OPTIONS.map((o, i) => {
            const checked = theme === o.value;
            return (
              <li key={o.value}>
                <button
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  onClick={() => setTheme(o.value)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className="flex min-h-12 w-full items-center gap-3 pl-4 text-left hover:bg-surface-2/60 active:bg-surface-2"
                >
                  <TileIcon size={30} color={o.color}>
                    {o.icon}
                  </TileIcon>
                  <span className="row-body flex flex-1 items-center gap-3 self-stretch py-2 pr-4">
                    <span className="flex-1">{o.label}</span>
                    {checked && (
                      <Check aria-hidden size={20} strokeWidth={2.75} className="text-tint" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </GroupedList>
      </div>
      <SectionFooter>
        {theme === 'system'
          ? 'Segue o modo claro ou escuro do aparelho.'
          : 'Vale só neste aparelho, mesmo que o sistema mude.'}
      </SectionFooter>
    </section>
  );
}

import { useEffect, useState, type CSSProperties } from 'react';
import { getCategory } from '../../domain/categories';
import { formatMoney } from '../../domain/money';
import { SAVED_EVENT, type SavedDetail } from '../../hooks/useSaveExpense';
import { CategoryBadge, categoryColor } from '../../ui/CategoryIcon';

/** Tempo total na tela; a saída começa um pouco antes (ver .celebrate-out). */
const DURATION_MS = 1500;
const SPARKS = 10;

interface Shot extends SavedDetail {
  key: number;
}

/**
 * Recompensa ao lançar um gasto novo: um cartão translúcido no centro da tela com o ícone da
 * categoria, um "estouro" de pontos na cor dela, um check desenhado e o valor salvo.
 * Decorativo (aria-hidden): o aviso do topo já anuncia o lançamento para leitores de tela.
 * Não bloqueia toques e não aparece com "reduzir movimento".
 */
export function SaveCelebration() {
  const [shot, setShot] = useState<Shot | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<SavedDetail | undefined>).detail;
      if (!detail?.created) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      clearTimeout(timer);
      setShot({ ...detail, key: Date.now() });
      timer = setTimeout(() => setShot(null), DURATION_MS);
    };
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => {
      window.removeEventListener(SAVED_EVENT, onSaved);
      clearTimeout(timer);
    };
  }, []);

  if (!shot) return null;
  const color = categoryColor(shot.categoryId);

  return (
    <div
      aria-hidden
      data-testid="save-celebration"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        key={shot.key}
        className="celebrate-card flex bg-surface w-44 flex-col items-center gap-3 rounded-[1.75rem] px-4 pb-4 pt-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] ring-1 ring-separator"
      >
        <div className="relative flex size-20 items-center justify-center">
          {/* Onda que se expande a partir do ícone. */}
          <span
            className="celebrate-ripple absolute inset-0 rounded-[1.5rem] border-[3px]"
            style={{ borderColor: color }}
          />
          {Array.from({ length: SPARKS }, (_, i) => {
            const angle = (i / SPARKS) * Math.PI * 2 - Math.PI / 2;
            const dist = i % 2 ? 62 : 76;
            return (
              <span
                key={i}
                className="celebrate-spark absolute left-1/2 top-1/2 -ml-[5px] -mt-[5px] size-2.5 rounded-full"
                style={
                  {
                    background: i % 3 === 2 ? 'var(--ok)' : color,
                    '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
                    '--dy': `${Math.round(Math.sin(angle) * dist)}px`,
                  } as CSSProperties
                }
              />
            );
          })}
          <span className="celebrate-badge relative">
            <CategoryBadge id={shot.categoryId} size={64} />
            {/* Check desenhado no selo verde, no canto do ícone. */}
            <svg
              viewBox="0 0 28 28"
              width={28}
              height={28}
              className="celebrate-check absolute -bottom-1.5 -right-1.5"
            >
              <circle
                cx="14"
                cy="14"
                r="13"
                fill="var(--ok)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
              <path
                className="celebrate-check-path"
                d="M8.5 14.5l3.6 3.6 7.4-8"
                fill="none"
                stroke="var(--surface)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
              />
            </svg>
          </span>
        </div>
        <div className="celebrate-text flex flex-col items-center">
          <p className="figure text-title3 font-bold">{formatMoney(shot.amountCents)}</p>
          <p className="text-footnote text-muted">{getCategory(shot.categoryId).name}</p>
        </div>
      </div>
    </div>
  );
}

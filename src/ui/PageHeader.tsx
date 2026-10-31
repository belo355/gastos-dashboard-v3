import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Título grande do iOS: ao rolar, ele sai da tela e um título compacto aparece numa barra
 * translúcida no topo. O h1 é sempre o título grande; a barra compacta é só visual.
 */
export function PageHeader({
  id,
  title,
  srSuffix,
  trailing,
  leading,
}: {
  id: string;
  title: string;
  /** Complemento só para leitores de tela (ex.: "da carteira Pessoal"). */
  srSuffix?: string;
  /** Ações à direita do título grande (ex.: botão de gerenciar). */
  trailing?: ReactNode;
  /** Linha acima do título grande (ex.: botão de voltar). */
  leading?: ReactNode;
}) {
  const sentinel = useRef<HTMLHeadingElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setCompact(entry ? !entry.isIntersecting : false),
      { rootMargin: '-44px 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden
        className={`material compact-title fixed inset-x-0 top-0 z-30 border-b border-separator pt-[env(safe-area-inset-top)] ${
          compact ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <p
          className={`compact-title mx-auto flex h-11 max-w-2xl items-center justify-center px-16 text-headline font-semibold ${
            compact ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          <span className="truncate">{title}</span>
        </p>
      </div>
      {leading}
      <div className="flex items-end justify-between gap-3 pt-2">
        <h1 id={id} ref={sentinel} className="text-large-title font-bold">
          {title}
          {srSuffix && <span className="sr-only"> {srSuffix}</span>}
        </h1>
        {trailing && <div className="flex shrink-0 items-center gap-1 pb-0.5">{trailing}</div>}
      </div>
    </>
  );
}

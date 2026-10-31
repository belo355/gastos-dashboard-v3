import type { ReactNode } from 'react';

/**
 * Lista agrupada com cantos arredondados (estilo "inset grouped" do iOS).
 * Cada item deve envolver o conteúdo depois do ícone em `.row-body`, que recebe o separador.
 */
export function GroupedList({
  children,
  label,
  ordered,
  className = '',
  testId,
}: {
  children: ReactNode;
  label?: string;
  ordered?: boolean;
  className?: string;
  testId?: string;
}) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      aria-label={label}
      data-testid={testId}
      className={`grouped overflow-hidden rounded-2xl bg-surface ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Cabeçalho de seção: título forte à esquerda e uma ação opcional à direita. */
export function SectionHeader({
  id,
  title,
  action,
}: {
  id?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-3 flex min-h-11 items-end justify-between gap-3 px-1">
      <h2 id={id} className="text-title3 font-bold">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Rodapé de seção: texto explicativo pequeno abaixo do grupo. */
export function SectionFooter({ children }: { children: ReactNode }) {
  return <p className="-mt-2 px-4 text-footnote text-muted">{children}</p>;
}

/** Bloco branco simples para conteúdo que não é lista (gráficos, textos). */
export function Panel({
  children,
  className = '',
  labelledBy,
  testId,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  testId?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-testid={testId}
      className={`rounded-2xl bg-surface p-4 ${className}`}
    >
      {children}
    </section>
  );
}

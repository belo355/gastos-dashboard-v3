import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink hover:brightness-110',
  secondary: 'bg-tint-fill text-tint hover:brightness-[0.97]',
  ghost: 'bg-transparent text-tint hover:bg-surface-2',
  danger: 'bg-danger text-surface hover:brightness-110',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  block?: boolean;
}

/** Botão em cápsula, como os botões preenchidos e tingidos do iOS. */
export function Button({
  variant = 'primary',
  icon,
  block,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`press inline-flex min-h-12 min-w-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-headline font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Botão só com ícone: exige um rótulo acessível.
 * "plain" é o ícone azul das barras do iOS; "filled" é o círculo cinza de fechar das sheets.
 */
export function IconButton({
  label,
  icon,
  tone = 'plain',
  className = '',
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  icon: ReactNode;
  tone?: 'plain' | 'filled';
}) {
  const toneClass =
    tone === 'filled'
      ? 'text-muted [&>svg]:rounded-full [&>svg]:bg-surface-2 [&>svg]:p-1.5'
      : 'text-tint hover:bg-surface-2';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${toneClass} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}

import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'size'> & {
  invalid?: boolean;
  /** "hero": valor grande e centralizado, como no Apple Cash. */
  size?: 'default' | 'hero';
};

/** Campo de valor em R$ com teclado numérico decimal no celular. */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { invalid, size = 'default', className = '', placeholder = '0,00', ...rest },
  ref,
) {
  if (size === 'hero') {
    // O "medidor" invisível dá ao campo a largura do texto, para o R$ ficar colado ao valor.
    const shown = typeof rest.value === 'string' && rest.value !== '' ? rest.value : placeholder;
    return (
      <div
        className={`flex items-baseline justify-center gap-1.5 rounded-2xl px-4 py-3 focus-within:bg-surface-2 ${invalid ? 'ring-2 ring-danger' : ''} ${className}`}
      >
        <span aria-hidden className="figure text-title1 font-semibold text-muted">
          R$
        </span>
        <span className="inline-grid min-w-0 max-w-full">
          <span
            aria-hidden
            className="figure invisible col-start-1 row-start-1 overflow-hidden whitespace-pre text-[3.25rem] leading-[1.1] font-bold"
          >
            {shown}
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            // size=1 tira a largura padrão do campo: quem define a largura é o medidor.
            size={1}
            className="figure col-start-1 row-start-1 w-full min-w-[2ch] bg-transparent text-[3.25rem] leading-[1.1] font-bold outline-none placeholder:text-muted"
            {...rest}
          />
        </span>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center rounded-xl bg-surface-2 px-4 focus-within:ring-2 focus-within:ring-tint ${invalid ? 'ring-2 ring-danger' : ''} ${className}`}
    >
      <span aria-hidden className="figure mr-2 text-title3 font-semibold text-muted">
        R$
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="next"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className="figure min-h-14 w-full bg-transparent text-title1 font-bold outline-none placeholder:text-muted"
        {...rest}
      />
    </div>
  );
});

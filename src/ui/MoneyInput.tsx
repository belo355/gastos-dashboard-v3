import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> & {
  invalid?: boolean;
};

/** Campo de valor em R$ com teclado numérico decimal no celular. */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { invalid, className = '', ...rest },
  ref,
) {
  return (
    <div
      className={`flex items-center rounded-2xl border-2 bg-surface-2 px-4 focus-within:border-primary ${invalid ? 'border-danger' : 'border-transparent'} ${className}`}
    >
      <span aria-hidden className="mr-2 text-2xl font-semibold text-muted">
        R$
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="next"
        placeholder="0,00"
        aria-invalid={invalid || undefined}
        className="tabular min-h-14 w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted/60"
        {...rest}
      />
    </div>
  );
});

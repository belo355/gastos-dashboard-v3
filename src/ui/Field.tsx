import type { ReactNode } from 'react';

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-semibold text-danger">
      {children}
    </p>
  );
}

export const inputClass =
  'min-h-12 w-full rounded-xl border-2 border-border bg-surface-2 px-3 text-base text-text outline-none focus:border-primary aria-[invalid=true]:border-danger';

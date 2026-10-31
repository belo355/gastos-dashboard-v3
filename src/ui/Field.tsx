import type { ReactNode } from 'react';

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-subhead font-semibold text-danger">
      {children}
    </p>
  );
}

/** Campo preenchido, como os campos de busca e formulários do iOS. */
export const inputClass =
  'min-h-12 w-full rounded-xl bg-surface-2 px-4 text-body text-text outline-none placeholder:text-muted focus:ring-2 focus:ring-tint aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger';

/** Rótulo de campo (subtítulo discreto acima do campo). */
export const labelClass = 'mb-1.5 block text-subhead font-semibold text-muted';

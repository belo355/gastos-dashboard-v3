import type { ReactNode } from 'react';

/** Estado vazio como o ContentUnavailableView do iOS: ícone grande, título, texto e ação. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-2 text-muted">{icon}</div>}
      <p className="text-title3 font-bold text-balance">{title}</p>
      {children && <div className="text-muted">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

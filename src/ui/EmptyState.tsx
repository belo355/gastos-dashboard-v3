import type { ReactNode } from 'react';

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
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      {icon && <div className="text-primary">{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="text-muted">{children}</div>}
      {action}
    </div>
  );
}

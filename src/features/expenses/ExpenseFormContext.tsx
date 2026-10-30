import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Expense } from '../../domain/types';
import { ExpenseFormSheet } from './ExpenseFormSheet';

interface ExpenseFormApi {
  openNew: () => void;
  openEdit: (expense: Expense) => void;
}

const Ctx = createContext<ExpenseFormApi | null>(null);

/** Mantém um único formulário de lançamento, aberto a partir de qualquer tela. */
export function ExpenseFormProvider({
  children,
  onSaved,
}: {
  children: ReactNode;
  onSaved?: () => void;
}) {
  const [state, setState] = useState<{ open: boolean; expense?: Expense }>({ open: false });
  const openNew = useCallback(() => setState({ open: true }), []);
  const openEdit = useCallback((expense: Expense) => setState({ open: true, expense }), []);
  const api = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <ExpenseFormSheet
        open={state.open}
        expense={state.expense}
        onClose={() => setState({ open: false })}
        onSaved={onSaved}
      />
    </Ctx.Provider>
  );
}

export function useExpenseForm(): ExpenseFormApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExpenseForm fora do ExpenseFormProvider');
  return ctx;
}

import { useCallback } from 'react';
import { expenseRepository } from '../data/expenseRepository';
import { settingsRepository } from '../data/settingsRepository';
import { requestPersistence } from '../data/storageGuard';
import { budgetPercent, detectThresholdCrossing } from '../domain/budget';
import { getCategory } from '../domain/categories';
import { monthKey } from '../domain/dates';
import { formatMoney } from '../domain/money';
import type { Expense, ExpenseInput } from '../domain/types';
import { useToast } from '../features/app/Toaster';
import { errorMessage } from '../lib/errors';
import { markSaveStart } from '../lib/perf';
import { readBudgetProgress } from './useBudgets';

export type SaveResult = { ok: true; expense?: Expense } | { ok: false; message: string };

/** Disparado após cada gravação bem-sucedida (para a microanimação de confirmação). */
export const SAVED_EVENT = 'gastos:expense-saved';

let persistenceAsked = false;

/**
 * Pede armazenamento persistente depois do primeiro lançamento salvo (com interação,
 * o navegador concede com mais facilidade). Pergunta uma vez por sessão, enquanto não houver resposta.
 */
async function askPersistenceOnce() {
  if (persistenceAsked) return;
  persistenceAsked = true;
  try {
    const settings = await settingsRepository.get();
    if (settings?.persistenceGranted === true) return;
    const granted = await requestPersistence();
    await settingsRepository.update({ persistenceGranted: granted });
  } catch {
    // Sem a Storage API, o app segue funcionando; a tela de privacidade reforça a exportação.
  }
}

/**
 * Grava (cria ou edita) um lançamento, publica a confirmação e,
 * se a categoria entrou em alerta ou estourou o limite, um aviso.
 */
export function useSaveExpense() {
  const toast = useToast();

  return useCallback(
    async (input: ExpenseInput, editingId?: string): Promise<SaveResult> => {
      const month = monthKey(input.date);
      const name = getCategory(input.categoryId).name;
      try {
        markSaveStart();
        const before = await readBudgetProgress(input.walletId, input.categoryId, month).catch(
          () => null,
        );
        let expense: Expense | undefined;
        if (editingId) await expenseRepository.update(editingId, input);
        else expense = await expenseRepository.create(input);

        if (!editingId) void askPersistenceOnce();
        window.dispatchEvent(new CustomEvent(SAVED_EVENT));
        const what = `${formatMoney(input.amountCents)} em ${name}`;
        toast.show(editingId ? `Gasto atualizado: ${what}` : `Gasto salvo: ${what}`);

        if (before) {
          const after = await readBudgetProgress(input.walletId, input.categoryId, month).catch(
            () => null,
          );
          const crossing = after && detectThresholdCrossing(before, after);
          if (after && crossing === 'warning') {
            toast.show(`${name} em alerta: ${budgetPercent(after)}% do limite`, {
              tone: 'warning',
              durationMs: 7000,
            });
          } else if (after && crossing === 'over') {
            toast.show(
              `${name} estourou o limite: ${formatMoney(after.excessCents)} acima do limite`,
              { tone: 'danger', durationMs: 8000 },
            );
          }
        }
        return { ok: true, expense };
      } catch (e) {
        return { ok: false, message: errorMessage(e) };
      }
    },
    [toast],
  );
}

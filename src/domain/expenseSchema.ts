import { z } from 'zod';
import { CATEGORY_IDS } from './categories';
import { isValidDate } from './dates';
import { MAX_AMOUNT_CENTS } from './money';
import type { ExpenseInput } from './types';

export const DESCRIPTION_MAX = 80;

export const MESSAGES = {
  amount: 'Informe o valor',
  amountTooHigh: 'O valor máximo é R$ 999.999,99',
  date: 'Data inválida',
  category: 'Escolha uma categoria',
  description: `Use até ${DESCRIPTION_MAX} caracteres`,
} as const;

export const descriptionSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX, { error: MESSAGES.description })
  .nullish()
  .transform((v) => (v ? v : null));

export const expenseInputSchema = z.object({
  walletId: z.string().min(1),
  date: z.string({ error: MESSAGES.date }).refine(isValidDate, { error: MESSAGES.date }),
  categoryId: z.enum(CATEGORY_IDS, { error: MESSAGES.category }),
  amountCents: z
    .number({ error: MESSAGES.amount })
    .int({ error: MESSAGES.amount })
    .positive({ error: MESSAGES.amount })
    .max(MAX_AMOUNT_CENTS, { error: MESSAGES.amountTooHigh }),
  description: descriptionSchema,
});

export type ExpenseField = 'date' | 'categoryId' | 'amountCents' | 'description';
export type ExpenseErrors = Partial<Record<ExpenseField, string>>;

export type ValidationResult =
  { ok: true; value: ExpenseInput } | { ok: false; errors: ExpenseErrors };

/** Valida a entrada do formulário; devolve uma mensagem por campo. */
export function validateExpenseInput(raw: unknown): ValidationResult {
  const parsed = expenseInputSchema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: ExpenseErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as ExpenseField | undefined;
    if (field && field !== ('walletId' as string) && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

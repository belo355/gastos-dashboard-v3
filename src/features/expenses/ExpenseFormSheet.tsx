import { useId, useRef, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { expenseRepository } from '../../data/expenseRepository';
import type { CategoryId } from '../../domain/categories';
import { today } from '../../domain/dates';
import {
  DESCRIPTION_MAX,
  validateExpenseInput,
  type ExpenseErrors,
} from '../../domain/expenseSchema';
import { formatMoneyInput, parseMoney } from '../../domain/money';
import type { Expense } from '../../domain/types';
import { useSaveExpense } from '../../hooks/useSaveExpense';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { FieldError, inputClass, labelClass } from '../../ui/Field';
import { MoneyInput } from '../../ui/MoneyInput';
import { Modal } from '../../ui/Sheet';
import { useAppState } from '../app/AppState';
import { useToast } from '../app/Toaster';
import { CategoryPicker } from './CategoryPicker';

interface Props {
  open: boolean;
  /** Lançamento em edição; ausente para um novo. */
  expense?: Expense;
  onClose: () => void;
  onSaved?: () => void;
}

export function ExpenseFormSheet({ open, expense, onClose, onSaved }: Props) {
  return (
    <Modal open={open} title={expense ? 'Editar gasto' : 'Lançar gasto'} onClose={onClose}>
      {/* A chave recria o formulário a cada abertura, com os valores iniciais certos. */}
      {open && (
        <ExpenseForm
          key={expense?.id ?? 'novo'}
          expense={expense}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function ExpenseForm({ expense, onClose, onSaved }: Omit<Props, 'open'>) {
  const { activeWallet } = useAppState();
  const save = useSaveExpense();
  const toast = useToast();
  const ids = {
    amount: useId(),
    amountErr: useId(),
    cat: useId(),
    catErr: useId(),
    date: useId(),
    dateErr: useId(),
    desc: useId(),
    descErr: useId(),
  };

  const [amountText, setAmountText] = useState(
    expense ? formatMoneyInput(expense.amountCents) : '',
  );
  const [categoryId, setCategoryId] = useState<CategoryId | null>(expense?.categoryId ?? null);
  const [date, setDate] = useState(expense?.date ?? today());
  const [description, setDescription] = useState(expense?.description ?? '');
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const result = validateExpenseInput({
      walletId: expense?.walletId ?? activeWallet.id,
      date,
      categoryId: categoryId ?? undefined,
      amountCents: parseMoney(amountText) ?? 0,
      description,
    });
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.amountCents) amountRef.current?.focus();
      else if (result.errors.categoryId)
        document
          .getElementById(ids.cat)
          ?.parentElement?.querySelector<HTMLElement>('[role="radio"]')
          ?.focus();
      else if (result.errors.date) dateRef.current?.focus();
      else if (result.errors.description) descRef.current?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    const saved = await save(result.value, expense?.id);
    setSaving(false);
    if (saved.ok) {
      onSaved?.();
      onClose();
    } else {
      // Mantém tudo o que foi digitado para tentar de novo.
      setFormError(saved.message);
    }
  }

  async function onDelete() {
    if (!expense) return;
    try {
      await expenseRepository.remove(expense.id);
      toast.show('Gasto excluído');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setConfirmDelete(false);
      setFormError(errorMessage(err));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <label htmlFor={ids.amount} className="sr-only">
          Valor
        </label>
        <MoneyInput
          id={ids.amount}
          size="hero"
          ref={amountRef}
          data-autofocus
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          invalid={!!errors.amountCents}
          aria-describedby={errors.amountCents ? ids.amountErr : undefined}
        />
        <FieldError id={ids.amountErr}>{errors.amountCents}</FieldError>
      </div>

      <div>
        <p id={ids.cat} className={labelClass}>
          Categoria
        </p>
        <CategoryPicker
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setErrors((er) => ({ ...er, categoryId: undefined }));
          }}
          labelledBy={ids.cat}
          describedBy={errors.categoryId ? ids.catErr : undefined}
          invalid={!!errors.categoryId}
        />
        <FieldError id={ids.catErr}>{errors.categoryId}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.date} className={labelClass}>
            Data
          </label>
          <input
            id={ids.date}
            ref={dateRef}
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date || undefined}
            aria-describedby={errors.date ? ids.dateErr : undefined}
          />
          <FieldError id={ids.dateErr}>{errors.date}</FieldError>
        </div>
        <div>
          <label htmlFor={ids.desc} className={labelClass}>
            Descrição <span className="font-normal">(opcional)</span>
          </label>
          <input
            id={ids.desc}
            ref={descRef}
            type="text"
            className={inputClass}
            value={description}
            maxLength={DESCRIPTION_MAX}
            placeholder="Ex.: almoço"
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description || undefined}
            aria-describedby={errors.description ? ids.descErr : undefined}
          />
          <FieldError id={ids.descErr}>{errors.description}</FieldError>
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 font-semibold text-text">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" block disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
        {expense && (
          <Button
            variant="ghost"
            block
            icon={<Trash2 aria-hidden size={18} />}
            className="!text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir este gasto?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}

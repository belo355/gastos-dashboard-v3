import { useId, useState, type FormEvent } from 'react';
import { budgetRepository } from '../../data/budgetRepository';
import { getCategory, type CategoryId } from '../../domain/categories';
import { formatMonthLabel } from '../../domain/dates';
import { formatMoneyInput, parseMoney } from '../../domain/money';
import type { MonthKey } from '../../domain/types';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { FieldError, labelClass } from '../../ui/Field';
import { MoneyInput } from '../../ui/MoneyInput';
import { Modal } from '../../ui/Sheet';
import { useToast } from '../app/Toaster';

interface Props {
  walletId: string;
  month: MonthKey;
  categoryId: CategoryId | null;
  currentLimit?: number;
  onClose: () => void;
}

/** Define, altera ou remove o limite a partir do mês selecionado (vale para os seguintes). */
export function BudgetEditor({ walletId, month, categoryId, currentLimit, onClose }: Props) {
  return (
    <Modal
      open={categoryId !== null}
      title={categoryId ? `Limite de ${getCategory(categoryId).name}` : ''}
      onClose={onClose}
    >
      {categoryId && (
        <EditorForm
          key={categoryId}
          walletId={walletId}
          month={month}
          categoryId={categoryId}
          currentLimit={currentLimit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function EditorForm({
  walletId,
  month,
  categoryId,
  currentLimit,
  onClose,
}: Props & { categoryId: CategoryId }) {
  const toast = useToast();
  const ids = { input: useId(), err: useId(), hint: useId() };
  const [text, setText] = useState(currentLimit ? formatMoneyInput(currentLimit) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = getCategory(categoryId).name;

  async function persist(cents: number | null) {
    setBusy(true);
    try {
      await budgetRepository.setLimit(walletId, categoryId, month, cents);
      toast.show(cents === null ? `Limite de ${name} removido` : `Limite de ${name} salvo`);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(text);
    if (cents === null) {
      setError('Informe o valor do limite');
      return;
    }
    void persist(cents);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor={ids.input} className={labelClass}>
          Limite mensal
        </label>
        <MoneyInput
          id={ids.input}
          data-autofocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          invalid={!!error}
          aria-describedby={`${ids.hint}${error ? ` ${ids.err}` : ''}`}
        />
        <p id={ids.hint} className="mt-1.5 px-1 text-footnote text-muted">
          Vale a partir de {formatMonthLabel(month)} e nos meses seguintes, até você mudar.
        </p>
        <FieldError id={ids.err}>{error}</FieldError>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" block disabled={busy}>
          Salvar limite
        </Button>
        {currentLimit !== undefined && (
          <Button
            variant="ghost"
            block
            className="!text-danger"
            disabled={busy}
            onClick={() => void persist(null)}
          >
            Remover limite
          </Button>
        )}
      </div>
    </form>
  );
}

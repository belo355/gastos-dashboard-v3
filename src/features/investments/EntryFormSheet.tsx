import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { investmentRepository } from '../../data/investmentRepository';
import { today } from '../../domain/dates';
import {
  ENTRY_LABEL,
  ENTRY_NOTE_MAX,
  INVESTMENT_MAX_CENTS,
  validateEntryInput,
  type EntryErrors,
  type EntryKind,
  type Investment,
  type InvestmentEntry,
  type Position,
} from '../../domain/investments';
import { formatMoney, formatMoneyInput, parseMoney } from '../../domain/money';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { FieldError, inputClass, labelClass } from '../../ui/Field';
import { MoneyInput } from '../../ui/MoneyInput';
import { Segmented } from '../../ui/Segmented';
import { Modal } from '../../ui/Sheet';
import { useToast } from '../app/Toaster';
import { TypeIcon } from './TypeIcon';

const KIND_OPTIONS: { value: EntryKind; label: string }[] = [
  { value: 'aporte', label: 'Aporte' },
  { value: 'resgate', label: 'Resgate' },
  { value: 'saldo', label: 'Saldo' },
];

const KIND_HINT: Record<EntryKind, string> = {
  aporte: 'Dinheiro que entrou no investimento.',
  resgate: 'Dinheiro que saiu do investimento.',
  saldo: 'Quanto o investimento vale nesta data, como aparece no banco ou na corretora.',
};

export interface EntryFormState {
  open: boolean;
  entry?: InvestmentEntry;
  investmentId?: string;
  kind?: EntryKind;
}

/** Lança ou edita uma movimentação: aporte, resgate ou saldo informado. */
export function EntryFormSheet({
  state,
  investments,
  positions,
  onClose,
}: {
  state: EntryFormState;
  investments: readonly Investment[];
  positions: readonly Position[];
  onClose: () => void;
}) {
  const title = state.entry ? 'Editar movimentação' : 'Lançar investimento';
  return (
    <Modal open={state.open} title={title} onClose={onClose}>
      {state.open && (
        <EntryForm
          key={state.entry?.id ?? `novo-${state.investmentId ?? ''}`}
          state={state}
          investments={investments}
          positions={positions}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function EntryForm({
  state,
  investments,
  positions,
  onClose,
}: {
  state: EntryFormState;
  investments: readonly Investment[];
  positions: readonly Position[];
  onClose: () => void;
}) {
  const toast = useToast();
  const id = useId();
  const ids = {
    inv: `${id}-inv`,
    invErr: `${id}-inv-err`,
    amount: `${id}-amount`,
    amountHint: `${id}-amount-hint`,
    amountErr: `${id}-amount-err`,
    date: `${id}-date`,
    dateErr: `${id}-date-err`,
    note: `${id}-note`,
    noteErr: `${id}-note-err`,
  };
  const { entry } = state;
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? state.kind ?? 'aporte');
  const [investmentId, setInvestmentId] = useState<string | null>(
    entry?.investmentId ??
      state.investmentId ??
      (investments.length === 1 ? investments[0]!.id : null),
  );
  const [amount, setAmount] = useState(entry ? formatMoneyInput(entry.amountCents) : '');
  const [date, setDate] = useState(entry?.date ?? today());
  const [note, setNote] = useState(entry?.note ?? '');
  const [errors, setErrors] = useState<EntryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const fixed = !!(entry || state.investmentId);
  const position = positions.find((p) => p.investment.id === investmentId);
  const selected = investments.find((i) => i.id === investmentId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const r = validateEntryInput({
      investmentId: investmentId ?? '',
      date,
      kind,
      amountCents: parseMoney(amount, INVESTMENT_MAX_CENTS) ?? 0,
      note,
    });
    if (!r.ok) {
      setErrors(r.errors);
      if (r.errors.amountCents) amountRef.current?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (entry) await investmentRepository.updateEntry(entry.id, r.value);
      else await investmentRepository.addEntry(r.value);
      const name = selected?.name ?? '';
      toast.show(
        `${entry ? 'Movimentação atualizada' : `${ENTRY_LABEL[kind]} salvo`}: ${formatMoney(r.value.amountCents)} em ${name}`,
      );
      onClose();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!entry) return;
    try {
      await investmentRepository.removeEntry(entry.id);
      toast.show('Movimentação excluída');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setConfirmDelete(false);
      setFormError(errorMessage(err));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <Segmented
        label="Tipo de movimentação"
        options={KIND_OPTIONS}
        value={kind}
        onChange={setKind}
      />

      <div className="text-center">
        <label htmlFor={ids.amount} className="sr-only">
          Valor
        </label>
        <MoneyInput
          id={ids.amount}
          size="hero"
          ref={amountRef}
          data-autofocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          invalid={!!errors.amountCents}
          aria-describedby={`${ids.amountHint}${errors.amountCents ? ` ${ids.amountErr}` : ''}`}
        />
        <p id={ids.amountHint} className="mt-1 px-4 text-footnote text-muted">
          {KIND_HINT[kind]}
          {kind === 'resgate' && position && position.valueCents > 0 && (
            <> Disponível hoje: {formatMoney(position.valueCents)}.</>
          )}
        </p>
        <FieldError id={ids.amountErr}>{errors.amountCents}</FieldError>
      </div>

      <div>
        <p id={ids.inv} className={labelClass}>
          Investimento
        </p>
        {fixed && selected ? (
          <div className="flex min-h-12 items-center gap-3 rounded-xl bg-surface-2 px-3">
            <TypeIcon type={selected.type} size={28} />
            <span className="font-semibold">{selected.name}</span>
          </div>
        ) : (
          <InvestmentPicker
            investments={investments}
            value={investmentId}
            onChange={(v) => {
              setInvestmentId(v);
              setErrors((er) => ({ ...er, investmentId: undefined }));
            }}
            labelledBy={ids.inv}
            describedBy={errors.investmentId ? ids.invErr : undefined}
            invalid={!!errors.investmentId}
          />
        )}
        <FieldError id={ids.invErr}>{errors.investmentId}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.date} className={labelClass}>
            Data
          </label>
          <input
            id={ids.date}
            type="date"
            className={inputClass}
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date || undefined}
            aria-describedby={errors.date ? ids.dateErr : undefined}
          />
          <FieldError id={ids.dateErr}>{errors.date}</FieldError>
        </div>
        <div>
          <label htmlFor={ids.note} className={labelClass}>
            Observação <span className="font-normal">(opcional)</span>
          </label>
          <input
            id={ids.note}
            type="text"
            className={inputClass}
            value={note}
            maxLength={ENTRY_NOTE_MAX}
            placeholder="Ex.: 13º salário"
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={!!errors.note || undefined}
            aria-describedby={errors.note ? ids.noteErr : undefined}
          />
          <FieldError id={ids.noteErr}>{errors.note}</FieldError>
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 font-semibold text-text">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" block disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </Button>
        {entry && (
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
        title="Excluir esta movimentação?"
        description="O patrimônio e o histórico serão recalculados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => void onDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}

/** Lista de investimentos para escolher (grupo de rádio com check, como nos Ajustes). */
function InvestmentPicker({
  investments,
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid,
}: {
  investments: readonly Investment[];
  value: string | null;
  onChange: (id: string) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = investments.findIndex((i) => i.id === value);
  const tabStop = selected >= 0 ? selected : 0;

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (index + step + investments.length) % investments.length;
    onChange(investments[next]!.id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={`max-h-64 overflow-y-auto rounded-xl bg-surface-2 ${invalid ? 'ring-2 ring-danger' : ''}`}
    >
      {investments.map((inv, i) => {
        const checked = inv.id === value;
        return (
          <button
            key={inv.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(inv.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex min-h-12 w-full items-center gap-3 px-3 text-left ${i > 0 ? 'border-t border-separator' : ''} ${checked ? 'font-semibold' : ''}`}
          >
            <TypeIcon type={inv.type} size={28} />
            <span className="flex-1 truncate">{inv.name}</span>
            {checked && <Check aria-hidden size={20} strokeWidth={2.75} className="text-tint" />}
          </button>
        );
      })}
    </div>
  );
}

import { useId, useRef, useState, type FormEvent } from 'react';
import { investmentRepository } from '../../data/investmentRepository';
import { isValidDate, today } from '../../domain/dates';
import {
  formatRate,
  INVESTMENT_MAX_CENTS,
  INVESTMENT_NAME_MAX,
  parseRateValue,
  validateInvestmentInput,
  type Investment,
  type InvestmentErrors,
  type InvestmentTypeId,
  type RateKind,
} from '../../domain/investments';
import { parseMoney } from '../../domain/money';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { FieldError, inputClass, labelClass } from '../../ui/Field';
import { MoneyInput } from '../../ui/MoneyInput';
import { Segmented } from '../../ui/Segmented';
import { Modal } from '../../ui/Sheet';
import { useToast } from '../app/Toaster';
import { TypePicker } from './TypePicker';

type RateChoice = 'none' | RateKind;

const RATE_OPTIONS: { value: RateChoice; label: string }[] = [
  { value: 'none', label: 'Sem taxa' },
  { value: 'cdi', label: '% do CDI' },
  { value: 'pre', label: 'Prefixado' },
  { value: 'ipca', label: 'IPCA +' },
];

const RATE_FIELD: Record<RateKind, { label: string; placeholder: string; suffix: string }> = {
  cdi: { label: 'Percentual do CDI', placeholder: '100', suffix: '% do CDI' },
  pre: { label: 'Taxa ao ano', placeholder: '12,5', suffix: '% a.a.' },
  ipca: { label: 'Adicional ao IPCA', placeholder: '6', suffix: '% a.a.' },
};

/** Cadastro (novo ou já existente) e edição de um investimento. */
export function InvestmentFormSheet({
  open,
  investment,
  onClose,
  onCreated,
}: {
  open: boolean;
  investment?: Investment;
  onClose: () => void;
  onCreated?: (inv: Investment) => void;
}) {
  return (
    <Modal
      open={open}
      title={investment ? 'Editar investimento' : 'Novo investimento'}
      onClose={onClose}
    >
      {open && (
        <InvestmentForm
          key={investment?.id ?? 'novo'}
          investment={investment}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

type Errors = InvestmentErrors & { applied?: string; appliedOn?: string; balance?: string };

function InvestmentForm({
  investment,
  onClose,
  onCreated,
}: {
  investment?: Investment;
  onClose: () => void;
  onCreated?: (inv: Investment) => void;
}) {
  const toast = useToast();
  const id = useId();
  const ids = {
    name: `${id}-name`,
    nameErr: `${id}-name-err`,
    type: `${id}-type`,
    typeErr: `${id}-type-err`,
    applied: `${id}-applied`,
    appliedErr: `${id}-applied-err`,
    appliedOn: `${id}-applied-on`,
    appliedOnErr: `${id}-applied-on-err`,
    balance: `${id}-balance`,
    balanceHint: `${id}-balance-hint`,
    balanceErr: `${id}-balance-err`,
    rate: `${id}-rate`,
    rateErr: `${id}-rate-err`,
    maturity: `${id}-maturity`,
    maturityErr: `${id}-maturity-err`,
  };
  const editing = !!investment;

  const [name, setName] = useState(investment?.name ?? '');
  const [type, setType] = useState<InvestmentTypeId | null>(investment?.type ?? null);
  const [applied, setApplied] = useState('');
  const [appliedOn, setAppliedOn] = useState(today());
  const [balance, setBalance] = useState('');
  const [rateKind, setRateKind] = useState<RateChoice>(investment?.rate?.kind ?? 'none');
  const [rateText, setRateText] = useState(
    investment?.rate ? String(investment.rate.value).replace('.', ',') : '',
  );
  const [maturity, setMaturity] = useState(investment?.maturity ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const rateValue = rateKind === 'none' ? null : parseRateValue(rateText);
    const r = validateInvestmentInput({
      name,
      type: type ?? undefined,
      rate: rateKind === 'none' ? null : { kind: rateKind, value: rateValue ?? Number.NaN },
      maturity: maturity || null,
    });
    const next: Errors = r.ok ? {} : { ...r.errors };
    if (rateKind !== 'none' && rateValue === null) next.rate = 'Informe a taxa';

    const appliedCents = parseMoney(applied, INVESTMENT_MAX_CENTS);
    const balanceCents = balance.trim() ? parseMoney(balance, INVESTMENT_MAX_CENTS) : null;
    if (!editing) {
      if (appliedCents === null) next.applied = 'Informe o valor aplicado';
      if (!isValidDate(appliedOn)) next.appliedOn = 'Data inválida';
      else if (appliedOn > today()) next.appliedOn = 'A data não pode estar no futuro';
      if (balance.trim() && balanceCents === null) next.balance = 'Valor inválido';
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || !r.ok) {
      if (next.name) nameRef.current?.focus();
      return;
    }

    setBusy(true);
    try {
      if (investment) {
        await investmentRepository.update(investment.id, r.value);
        toast.show(`${r.value.name} atualizado`);
      } else {
        const created = await investmentRepository.create(r.value, {
          appliedCents: appliedCents!,
          appliedOn,
          balanceCents,
          balanceOn: today(),
        });
        toast.show(`${created.name} cadastrado`);
        onCreated?.(created);
      }
      onClose();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const rateField = rateKind === 'none' ? null : RATE_FIELD[rateKind];
  const previewRate =
    rateKind !== 'none' && parseRateValue(rateText) !== null
      ? formatRate({ kind: rateKind, value: parseRateValue(rateText)! })
      : null;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor={ids.name} className={labelClass}>
          Nome
        </label>
        <input
          id={ids.name}
          ref={nameRef}
          data-autofocus
          type="text"
          className={inputClass}
          value={name}
          maxLength={INVESTMENT_NAME_MAX}
          placeholder="Ex.: CDB Banco Digital"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? ids.nameErr : undefined}
        />
        <FieldError id={ids.nameErr}>{errors.name}</FieldError>
      </div>

      <div>
        <p id={ids.type} className={labelClass}>
          Tipo
        </p>
        <TypePicker
          value={type}
          onChange={(t) => {
            setType(t);
            setErrors((er) => ({ ...er, type: undefined }));
          }}
          labelledBy={ids.type}
          describedBy={errors.type ? ids.typeErr : undefined}
          invalid={!!errors.type}
        />
        <FieldError id={ids.typeErr}>{errors.type}</FieldError>
      </div>

      {!editing && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.applied} className={labelClass}>
                Valor aplicado
              </label>
              <MoneyInput
                id={ids.applied}
                value={applied}
                onChange={(e) => setApplied(e.target.value)}
                invalid={!!errors.applied}
                aria-describedby={errors.applied ? ids.appliedErr : undefined}
              />
              <FieldError id={ids.appliedErr}>{errors.applied}</FieldError>
            </div>
            <div>
              <label htmlFor={ids.appliedOn} className={labelClass}>
                Data da aplicação
              </label>
              <input
                id={ids.appliedOn}
                type="date"
                className={`${inputClass} min-h-14`}
                value={appliedOn}
                max={today()}
                onChange={(e) => setAppliedOn(e.target.value)}
                aria-invalid={!!errors.appliedOn || undefined}
                aria-describedby={errors.appliedOn ? ids.appliedOnErr : undefined}
              />
              <FieldError id={ids.appliedOnErr}>{errors.appliedOn}</FieldError>
            </div>
          </div>

          <div>
            <label htmlFor={ids.balance} className={labelClass}>
              Saldo atual <span className="font-normal">(opcional)</span>
            </label>
            <MoneyInput
              id={ids.balance}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              invalid={!!errors.balance}
              aria-describedby={`${ids.balanceHint}${errors.balance ? ` ${ids.balanceErr}` : ''}`}
            />
            <p id={ids.balanceHint} className="mt-1.5 px-1 text-footnote text-muted">
              Quanto vale hoje no banco ou na corretora. Sem ele, o app calcula pela taxa.
            </p>
            <FieldError id={ids.balanceErr}>{errors.balance}</FieldError>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <p id={ids.rate} className="text-subhead font-semibold text-muted">
          Rentabilidade
        </p>
        <Segmented
          label="Tipo de rentabilidade"
          options={RATE_OPTIONS}
          value={rateKind}
          onChange={(k) => {
            setRateKind(k);
            setErrors((er) => ({ ...er, rate: undefined }));
          }}
        />
        {rateField && (
          <div>
            <label htmlFor={`${ids.rate}-value`} className="sr-only">
              {rateField.label}
            </label>
            <div
              className={`flex items-center rounded-xl bg-surface-2 px-4 focus-within:ring-2 focus-within:ring-tint ${errors.rate ? 'ring-2 ring-danger' : ''}`}
            >
              <input
                id={`${ids.rate}-value`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="figure min-h-12 w-full bg-transparent text-body outline-none placeholder:text-muted"
                placeholder={rateField.placeholder}
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
                aria-invalid={!!errors.rate || undefined}
                aria-describedby={errors.rate ? ids.rateErr : undefined}
              />
              <span aria-hidden className="shrink-0 text-muted">
                {rateField.suffix}
              </span>
            </div>
            {previewRate && !errors.rate && (
              <p className="mt-1.5 px-1 text-footnote text-muted">
                Projeção por {previewRate}, corrigida sempre que você informar o saldo.
              </p>
            )}
          </div>
        )}
        <FieldError id={ids.rateErr}>{errors.rate}</FieldError>
      </div>

      <div>
        <label htmlFor={ids.maturity} className={labelClass}>
          Vencimento <span className="font-normal">(opcional)</span>
        </label>
        <input
          id={ids.maturity}
          type="date"
          className={inputClass}
          value={maturity}
          onChange={(e) => setMaturity(e.target.value)}
          aria-invalid={!!errors.maturity || undefined}
          aria-describedby={errors.maturity ? ids.maturityErr : undefined}
        />
        <FieldError id={ids.maturityErr}>{errors.maturity}</FieldError>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 font-semibold text-text">
          {formError}
        </p>
      )}

      <Button type="submit" block disabled={busy}>
        {busy ? 'Salvando…' : editing ? 'Salvar' : 'Cadastrar'}
      </Button>
    </form>
  );
}

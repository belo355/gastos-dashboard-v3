import { useId, useState, type FormEvent } from 'react';
import { investmentRepository } from '../../data/investmentRepository';
import { parseRateValue, type MarketRefs } from '../../domain/investments';
import { errorMessage } from '../../lib/errors';
import { Button } from '../../ui/Button';
import { FieldError, labelClass } from '../../ui/Field';
import { Modal } from '../../ui/Sheet';
import { useToast } from '../app/Toaster';

const fmt = (n: number) => String(n).replace('.', ',');

/**
 * Taxas de referência usadas nas projeções (% do CDI e IPCA+). O app não busca taxas na internet:
 * o usuário mantém os valores atualizados.
 */
export function RatesSheet({
  open,
  refs,
  onClose,
}: {
  open: boolean;
  refs: MarketRefs;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Taxas de referência"
      description="Usadas para projetar investimentos com rentabilidade em % do CDI ou IPCA +. O app não busca taxas na internet: atualize quando elas mudarem."
      onClose={onClose}
    >
      {open && <RatesForm refs={refs} onClose={onClose} />}
    </Modal>
  );
}

function RatesForm({ refs, onClose }: { refs: MarketRefs; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const [cdi, setCdi] = useState(fmt(refs.cdi));
  const [ipca, setIpca] = useState(fmt(refs.ipca));
  const [errors, setErrors] = useState<{ cdi?: string; ipca?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const c = parseRateValue(cdi);
    const i = parseRateValue(ipca);
    const next: typeof errors = {};
    if (c === null || c <= 0 || c > 100) next.cdi = 'Informe uma taxa entre 0,01% e 100%';
    if (i === null || i < -10 || i > 100) next.ipca = 'Informe uma taxa entre -10% e 100%';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      await investmentRepository.setRefs({ cdi: c!, ipca: i! });
      toast.show('Taxas de referência salvas');
      onClose();
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const field = (
    key: 'cdi' | 'ipca',
    label: string,
    value: string,
    set: (v: string) => void,
    autoFocus?: boolean,
  ) => (
    <div>
      <label htmlFor={`${id}-${key}`} className={labelClass}>
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl bg-surface-2 px-4 focus-within:ring-2 focus-within:ring-tint ${errors[key] ? 'ring-2 ring-danger' : ''}`}
      >
        <input
          id={`${id}-${key}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          data-autofocus={autoFocus || undefined}
          className="figure min-h-12 w-full bg-transparent text-body outline-none"
          value={value}
          onChange={(e) => set(e.target.value)}
          aria-invalid={!!errors[key] || undefined}
          aria-describedby={errors[key] ? `${id}-${key}-err` : undefined}
        />
        <span aria-hidden className="shrink-0 text-muted">
          % a.a.
        </span>
      </div>
      <FieldError id={`${id}-${key}-err`}>{errors[key]}</FieldError>
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {field('cdi', 'CDI', cdi, setCdi, true)}
      {field('ipca', 'IPCA (inflação esperada)', ipca, setIpca)}
      {errors.form && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 font-semibold text-text">
          {errors.form}
        </p>
      )}
      <Button type="submit" block disabled={busy}>
        Salvar taxas
      </Button>
    </form>
  );
}

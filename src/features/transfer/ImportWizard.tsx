import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { CircleCheck, TriangleAlert, Upload } from 'lucide-react';
import { expenseRepository } from '../../data/expenseRepository';
import { xlsxAdapter } from '../../data/xlsxAdapter';
import { formatMonthLabel } from '../../domain/dates';
import {
  groupByMonth,
  mergePreviews,
  normalizeRows,
  ROW_ERROR_LABEL,
  type ImportPreview,
} from '../../domain/importRules';
import { formatMoney } from '../../domain/money';
import { useActiveWallet } from '../../hooks/useActiveWallet';
import { errorMessage } from '../../lib/errors';
import { plural } from '../../lib/format';
import { log } from '../../lib/log';
import { Button } from '../../ui/Button';
import { useToast } from '../app/Toaster';
import { WalletSelect } from './WalletSelect';

type Step =
  | { kind: 'choose'; error?: string }
  | { kind: 'reading' }
  | { kind: 'preview'; preview: ImportPreview; files: string[] }
  | { kind: 'done'; count: number; months: string[] };

/** Importar: escolher → prévia → conflito (substituir/cancelar) → confirmar. Tudo processado no aparelho. */
export function ImportWizard() {
  const { wallet: active, wallets } = useActiveWallet();
  const toast = useToast();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [walletId, setWalletId] = useState(active.id);
  const wallet = wallets.find((w) => w.id === walletId) ?? active;
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [saving, setSaving] = useState(false);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length === 0) return;
    setStep({ kind: 'reading' });
    try {
      const existing = await expenseRepository.monthsWithData(wallet.id);
      const previews: ImportPreview[] = [];
      for (const f of files)
        previews.push(normalizeRows(await xlsxAdapter.parseWorkbook(f), existing));
      setStep({
        kind: 'preview',
        preview: mergePreviews(previews),
        files: files.map((f) => f.name),
      });
    } catch (err) {
      setStep({ kind: 'choose', error: errorMessage(err) });
    }
  }

  async function onConfirm(preview: ImportPreview) {
    setSaving(true);
    try {
      await expenseRepository.replaceMonths(wallet.id, groupByMonth(preview.valid));
      log.debug('import.done', {
        valid: preview.valid.length,
        discarded: preview.discarded.length,
      });
      toast.show(
        `${plural(preview.valid.length, 'lançamento importado', 'lançamentos importados')}`,
      );
      setStep({ kind: 'done', count: preview.valid.length, months: preview.months });
    } catch (err) {
      setStep({ kind: 'choose', error: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="imp-title" className="flex flex-col gap-4">
      <h1 id="imp-title" className="text-2xl font-bold">
        Importar planilha
      </h1>

      {(step.kind === 'choose' || step.kind === 'reading') && (
        <>
          <p className="text-muted">
            Escolha um ou mais arquivos .xlsx no formato do app (veja a{' '}
            <Link to="/mais/modelo" className="font-semibold text-primary underline">
              planilha modelo
            </Link>
            ). O arquivo é lido aqui no aparelho e nunca é enviado.
          </p>
          <WalletSelect
            wallets={wallets}
            value={wallet.id}
            onChange={setWalletId}
            label="Importar para a carteira"
          />
          <div>
            <label
              htmlFor={inputId}
              className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary bg-surface p-4 text-center font-semibold text-primary focus-within:outline-3 focus-within:outline-[var(--focus)]"
            >
              <Upload aria-hidden size={28} />
              {step.kind === 'reading' ? 'Lendo planilha…' : 'Escolher planilhas (.xlsx)'}
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple
                className="sr-only"
                disabled={step.kind === 'reading'}
                onChange={onFiles}
              />
            </label>
          </div>
          {step.kind === 'choose' && step.error && (
            <p
              role="alert"
              className="rounded-xl border-2 border-danger bg-danger-bg px-3 py-2 font-semibold"
              data-testid="import-error"
            >
              {step.error}
            </p>
          )}
        </>
      )}

      {step.kind === 'preview' && (
        <PreviewStep
          preview={step.preview}
          files={step.files}
          walletName={wallet.name}
          saving={saving}
          onConfirm={() => onConfirm(step.preview)}
          onCancel={() => setStep({ kind: 'choose' })}
        />
      )}

      {step.kind === 'done' && (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-sm"
          data-testid="import-done"
        >
          <CircleCheck aria-hidden size={40} className="text-ok" />
          <p className="text-lg font-bold">Importação concluída</p>
          <p>
            {plural(step.count, 'lançamento', 'lançamentos')} em{' '}
            {step.months.map(formatMonthLabel).join(', ')}.
          </p>
          <div className="flex gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 font-semibold text-primary-ink"
            >
              Ver resumo
            </Link>
            <Button variant="secondary" onClick={() => setStep({ kind: 'choose' })}>
              Importar outra
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewStep({
  preview,
  files,
  walletName,
  saving,
  onConfirm,
  onCancel,
}: {
  preview: ImportPreview;
  files: string[];
  walletName: string;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const total = preview.valid.reduce((a, e) => a + e.amountCents, 0);
  const hasConflict = preview.conflicts.length > 0;
  return (
    <div className="flex flex-col gap-4" data-testid="import-preview">
      <h2 className="text-lg font-bold">Prévia da importação</h2>
      <p className="text-sm text-muted">
        {files.join(', ')} → carteira {walletName}
      </p>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-3 shadow-sm">
          <dt className="text-sm text-muted">Válidos</dt>
          <dd className="text-lg font-bold" data-testid="preview-valid">
            {plural(preview.valid.length, 'lançamento', 'lançamentos')}
          </dd>
          <dd className="tabular text-sm text-muted">{formatMoney(total)}</dd>
        </div>
        <div className="rounded-2xl bg-surface p-3 shadow-sm">
          <dt className="text-sm text-muted">Descartadas</dt>
          <dd className="text-lg font-bold" data-testid="preview-discarded">
            {plural(preview.discarded.length, 'linha descartada', 'linhas descartadas')}
          </dd>
          {preview.blankRows > 0 && (
            <dd className="text-sm text-muted">
              {plural(preview.blankRows, 'linha em branco ignorada', 'linhas em branco ignoradas')}
            </dd>
          )}
        </div>
        <div className="rounded-2xl bg-surface p-3 shadow-sm">
          <dt className="text-sm text-muted">Categoria não reconhecida</dt>
          <dd className="text-lg font-bold" data-testid="preview-others">
            {preview.remappedToOthers} em Outros
          </dd>
        </div>
      </dl>
      <p>
        <span className="font-semibold">Meses detectados:</span>{' '}
        <span data-testid="preview-months">
          {preview.months.map(formatMonthLabel).join(', ') || '—'}
        </span>
      </p>
      {preview.discarded.length > 0 && (
        <details className="rounded-2xl bg-surface p-3 shadow-sm">
          <summary className="min-h-11 cursor-pointer content-center font-semibold">
            Ver linhas descartadas
          </summary>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {preview.discarded.slice(0, 50).map((d) => (
              <li key={`${d.row}-${d.reason}`}>
                Linha {d.row}: {ROW_ERROR_LABEL[d.reason]}
              </li>
            ))}
          </ul>
        </details>
      )}

      {hasConflict && (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border-2 border-warning bg-warning-bg p-3"
          data-testid="import-conflict"
        >
          <TriangleAlert aria-hidden className="shrink-0 text-warning" />
          <p>
            <strong>{preview.conflicts.map(formatMonthLabel).join(', ')}</strong> já{' '}
            {preview.conflicts.length === 1 ? 'tem' : 'têm'} lançamentos nesta carteira. Substituir
            apaga os lançamentos atuais{' '}
            {preview.conflicts.length === 1 ? 'desse mês' : 'desses meses'} e coloca os da planilha
            no lugar.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button disabled={saving || preview.valid.length === 0} onClick={onConfirm}>
          {hasConflict
            ? 'Substituir'
            : `Importar ${plural(preview.valid.length, 'lançamento', 'lançamentos')}`}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

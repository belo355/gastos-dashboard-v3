import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { formatMonthLabel } from '../../domain/dates';
import { lastMonths, shortMonth, type MonthPoint } from '../../domain/investments';
import { formatMoney } from '../../domain/money';
import { Segmented } from '../../ui/Segmented';
import { compactMoney, gainTone, signedMoney, signedPercent } from './format';

type Range = '6' | '12' | 'all';
const RANGES: { value: Range; label: string }[] = [
  { value: '6', label: '6M' },
  { value: '12', label: '12M' },
  { value: 'all', label: 'Tudo' },
];

/** Topo "redondo" do eixo: 1, 2, 2,5, 3, 4 ou 5 × 10ⁿ por divisão, em 4 divisões. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 4, step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return { top: step * 4, step };
}

/**
 * Evolução do patrimônio mês a mês: cada barra é o patrimônio, dividida entre valor aplicado
 * (base) e ganho de capital (topo). Mês com perda mostra o aplicado tracejado acima do valor.
 * Tocar numa barra (ou usar as setas) mostra os números do mês no painel acima do gráfico.
 */
export function WealthChart({
  history,
  title = 'Evolução do patrimônio',
  headingId,
}: {
  history: readonly MonthPoint[];
  title?: string;
  headingId: string;
}) {
  const [range, setRange] = useState<Range>('12');
  const points = useMemo(
    () => lastMonths(history, range === 'all' ? null : Number(range)),
    [history, range],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    picked ? points.findIndex((p) => p.month === picked) : points.length - 1,
  );
  const sel = points[selectedIndex] ?? points[points.length - 1];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const max = Math.max(0, ...points.map((p) => Math.max(p.valueCents, p.appliedCents)));
  const { top, step } = niceScale(max);
  const ticks = [4, 3, 2, 1, 0].map((k) => k * step);
  const hasLoss = points.some((p) => p.gainCents < 0);
  // Com muitos meses, só alguns rótulos no eixo.
  const labelEvery = Math.ceil(points.length / 12);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: points.length - 1 - index }[
      e.key
    ];
    if (delta === undefined) return;
    e.preventDefault();
    const next = Math.min(points.length - 1, Math.max(0, index + delta));
    setPicked(points[next]!.month);
    refs.current[next]?.focus();
  }

  if (!sel) return null;
  const selReturn = sel.appliedCents > 0 ? (sel.gainCents / sel.appliedCents) * 100 : null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-headline font-semibold">
          {title}
        </h2>
        <Segmented
          label="Período do gráfico"
          options={RANGES}
          value={range}
          onChange={(r) => {
            setRange(r);
            setPicked(null);
          }}
          className="w-44"
        />
      </div>

      {/* Números do mês escolhido (substitui o tooltip, e funciona no toque). */}
      <div aria-live="polite" className="flex flex-col gap-2" data-testid="chart-detail">
        <p className="text-footnote text-muted">{formatMonthLabel(sel.month)}</p>
        <p className="figure text-title2 font-bold">{formatMoney(sel.valueCents)}</p>
        <dl className="grid grid-cols-2 gap-3 text-subhead">
          <div>
            <dt className="flex items-center gap-1.5 text-muted">
              <span aria-hidden className="size-2.5 rounded-[3px] bg-tint" />
              Valor aplicado
            </dt>
            <dd className="figure font-semibold whitespace-nowrap">
              {formatMoney(sel.appliedCents)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-muted">
              <span aria-hidden className="size-2.5 rounded-[3px] bg-ok" />
              Ganho de capital
            </dt>
            <dd className={`figure font-semibold whitespace-nowrap ${gainTone(sel.gainCents)}`}>
              {signedMoney(sel.gainCents)}
            </dd>
            {selReturn !== null && (
              <dd className={`figure text-footnote ${gainTone(sel.gainCents)}`}>
                {signedPercent(selReturn)} sobre o aplicado
              </dd>
            )}
          </div>
        </dl>
      </div>

      <div className="flex gap-2">
        {/* Eixo Y */}
        <div aria-hidden className="relative h-48 w-14 shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="figure absolute right-0 -translate-y-1/2 text-caption2 text-muted"
              style={{ top: `${(1 - t / top) * 100}%` }}
            >
              {compactMoney(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-48">
            {ticks.map((t) => (
              <span
                aria-hidden
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? 'border-border' : 'border-separator'}`}
                style={{ top: `${(1 - t / top) * 100}%` }}
              />
            ))}
            <div
              role="radiogroup"
              aria-label="Escolher mês do gráfico"
              className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5"
            >
              {points.map((p, i) => {
                const checked = i === selectedIndex;
                const appliedShown = Math.min(p.appliedCents, p.valueCents);
                const gain = Math.max(0, p.gainCents);
                const loss = Math.max(0, -p.gainCents);
                return (
                  <button
                    key={`${range}-${p.month}`}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={checked ? 0 : -1}
                    aria-label={`${formatMonthLabel(p.month)}: patrimônio ${formatMoney(p.valueCents)}, aplicado ${formatMoney(p.appliedCents)}, ganho ${signedMoney(p.gainCents)}`}
                    onClick={() => setPicked(p.month)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`group relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-md ${checked ? 'bg-surface-2' : ''}`}
                  >
                    <span
                      className="bar-rise flex w-full flex-col justify-end"
                      style={
                        {
                          height: `${(Math.max(p.valueCents, p.appliedCents) / top) * 100}%`,
                          '--i': i,
                        } as CSSProperties
                      }
                    >
                      {loss > 0 && (
                        <span
                          className="w-full rounded-t-[3px] border-2 border-b-0 border-dashed border-danger"
                          style={{ flexGrow: loss }}
                        />
                      )}
                      {gain > 0 && (
                        <span
                          className={`w-full rounded-t-[3px] bg-ok ${checked ? '' : 'opacity-80'}`}
                          style={{ flexGrow: gain }}
                        />
                      )}
                      {appliedShown > 0 && (
                        <span
                          className={`w-full bg-tint ${gain > 0 || loss > 0 ? '' : 'rounded-t-[3px]'} ${checked ? '' : 'opacity-80'}`}
                          style={{ flexGrow: appliedShown }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div aria-hidden className="mt-1.5 flex gap-[3px] sm:gap-1.5">
            {points.map((p, i) => {
              const fromEnd = points.length - 1 - i;
              const shown = fromEnd % labelEvery === 0;
              // No celular, metade dos rótulos some para não encavalar (contando a partir do último).
              const narrowHidden = shown && (fromEnd / labelEvery) % 2 === 1;
              return (
                <span
                  key={p.month}
                  className={`figure min-w-0 flex-1 overflow-visible text-center text-caption2 whitespace-nowrap ${i === selectedIndex ? 'font-semibold text-text' : 'text-muted'} ${narrowHidden ? 'max-sm:invisible' : ''}`}
                >
                  {shown ? shortMonth(p.month) : ''}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-footnote text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-tint" /> Valor aplicado
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-ok" /> Ganho de capital
        </li>
        {hasLoss && (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px] border-2 border-dashed border-danger"
            />{' '}
            Perda
          </li>
        )}
      </ul>
    </section>
  );
}

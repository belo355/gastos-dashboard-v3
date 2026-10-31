import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, currentMonth, formatMonthLabel } from '../../domain/dates';
import { IconButton } from '../../ui/Button';
import { useAppState } from '../app/AppState';

/** Navega entre meses; o mês escolhido vale para todas as abas. */
export function MonthSwitcher() {
  const { month, setMonth } = useAppState();
  const isCurrent = month === currentMonth();
  return (
    <div className="flex items-center justify-between gap-1">
      <IconButton
        label="Mês anterior"
        icon={<ChevronLeft aria-hidden size={26} strokeWidth={2.5} />}
        onClick={() => setMonth(addMonths(month, -1))}
      />
      <div className="flex min-h-11 flex-col items-center justify-center">
        <p className="text-headline font-semibold" aria-live="polite" data-testid="month-label">
          {formatMonthLabel(month)}
        </p>
        {!isCurrent && (
          <button
            type="button"
            className="min-h-6 text-footnote font-semibold text-tint underline-offset-2 hover:underline"
            onClick={() => setMonth(currentMonth())}
          >
            Voltar para hoje
          </button>
        )}
      </div>
      <IconButton
        label="Próximo mês"
        icon={<ChevronRight aria-hidden size={26} strokeWidth={2.5} />}
        onClick={() => setMonth(addMonths(month, 1))}
      />
    </div>
  );
}

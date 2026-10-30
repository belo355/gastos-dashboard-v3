import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, currentMonth, formatMonthLabel } from '../../domain/dates';
import { IconButton } from '../../ui/Button';
import { useAppState } from '../app/AppState';

/** Navega entre meses; o mês escolhido vale para todas as abas. */
export function MonthSwitcher() {
  const { month, setMonth } = useAppState();
  const isCurrent = month === currentMonth();
  return (
    <div className="flex items-center justify-between gap-1 rounded-2xl bg-surface px-1 py-1 shadow-sm">
      <IconButton
        label="Mês anterior"
        icon={<ChevronLeft aria-hidden />}
        onClick={() => setMonth(addMonths(month, -1))}
      />
      <div className="flex flex-col items-center">
        <p className="text-lg font-bold" aria-live="polite" data-testid="month-label">
          {formatMonthLabel(month)}
        </p>
        {!isCurrent && (
          <button
            type="button"
            className="min-h-6 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            onClick={() => setMonth(currentMonth())}
          >
            Voltar para hoje
          </button>
        )}
      </div>
      <IconButton
        label="Próximo mês"
        icon={<ChevronRight aria-hidden />}
        onClick={() => setMonth(addMonths(month, 1))}
      />
    </div>
  );
}

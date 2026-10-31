import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { TriangleAlert } from 'lucide-react';
import { db } from '../../data/db';
import { useAppState } from '../app/AppState';

export const REMINDER_DAYS = 30;
const DAY_MS = 86_400_000;

/** true quando o último backup (ou o primeiro lançamento, se nunca exportou) tem mais de 30 dias. */
export function needsExportReminder(
  lastExportAt: string | null,
  oldestCreatedAt: string | null,
  now = Date.now(),
): boolean {
  const ref = lastExportAt ?? oldestCreatedAt;
  if (!ref) return false;
  return now - Date.parse(ref) > REMINDER_DAYS * DAY_MS;
}

export function ExportReminder() {
  const { settings } = useAppState();
  const oldest = useLiveQuery(async () => {
    let min: string | null = null;
    await db.expenses.each((e) => {
      if (!min || e.createdAt < min) min = e.createdAt;
    });
    return min;
  }, []);
  if (oldest === undefined || !needsExportReminder(settings.lastExportAt, oldest)) return null;
  return (
    <div
      role="note"
      className="flex gap-3 rounded-2xl bg-warning-bg p-3"
      data-testid="export-reminder"
    >
      <TriangleAlert aria-hidden className="shrink-0 text-warning" />
      <p>
        {settings.lastExportAt
          ? 'Faz mais de 30 dias desde a última exportação.'
          : 'Você ainda não exportou seus dados.'}{' '}
        Como eles ficam só neste aparelho,{' '}
        <Link to="/mais/exportar" className="font-semibold text-tint underline">
          exporte uma planilha
        </Link>{' '}
        para não perdê-los.
      </p>
    </div>
  );
}

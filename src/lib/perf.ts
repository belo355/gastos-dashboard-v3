/**
 * Medição de "salvar → resumo renderizado" (meta: 300 ms), só em desenvolvimento.
 */
const START = 'gastos:save-start';
let pending = false;

export function markSaveStart() {
  if (!import.meta.env.DEV || typeof performance === 'undefined') return;
  performance.mark(START);
  pending = true;
}

export function markSummaryRendered() {
  if (!pending || typeof performance === 'undefined') return;
  pending = false;
  try {
    const m = performance.measure('gastos:save-to-summary', START);
    if (import.meta.env.MODE !== 'test')
      console.debug(`[gastos] salvar → resumo: ${Math.round(m.duration)} ms`);
  } catch {
    // A marca inicial pode ter sido descartada; ignora.
  }
}

/**
 * Logger interno. Nunca registre valores, descrições ou nomes de carteira:
 * apenas o nome da operação, códigos de erro e contagens.
 */
type Fields = Record<string, string | number | boolean | null>;

const isDev = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const log = {
  debug(event: string, fields?: Fields) {
    if (isDev) console.debug(`[gastos] ${event}`, fields ?? '');
  },
  warn(event: string, fields?: Fields) {
    console.warn(`[gastos] ${event}`, fields ?? '');
  },
  error(event: string, fields?: Fields) {
    console.error(`[gastos] ${event}`, fields ?? '');
  },
};

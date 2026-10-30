import { AppError, isAppError } from '../lib/errors';
import { log } from '../lib/log';
import { db, type GastosDB } from './db';

function errorNames(e: unknown): string[] {
  const names: string[] = [];
  let cur: unknown = e;
  for (let i = 0; cur && i < 5; i++) {
    const c = cur as { name?: unknown; inner?: unknown; cause?: unknown };
    if (typeof c.name === 'string') names.push(c.name);
    cur = c.inner ?? c.cause;
  }
  return names;
}

/** Traduz exceções do IndexedDB/Dexie para AppError. */
export function toStorageError(e: unknown): AppError {
  if (isAppError(e)) return e;
  const names = errorNames(e);
  const code = names.includes('QuotaExceededError') ? 'storage_quota' : 'storage_unavailable';
  return new AppError(code, { cause: e });
}

/** Executa uma operação de armazenamento, convertendo falhas em AppError e registrando o código. */
export async function guard<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const err = toStorageError(e);
    if (err.code === 'storage_quota' || err.code === 'storage_unavailable') {
      log.error('storage.write_failed', { operation, code: err.code });
    }
    throw err;
  }
}

/** Abre o banco na inicialização; falha com AppError se o IndexedDB estiver indisponível. */
export async function openDatabase(database: GastosDB = db): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    log.error('storage.open_failed', { code: 'storage_unavailable' });
    throw new AppError('storage_unavailable');
  }
  try {
    await database.open();
  } catch (e) {
    const err = toStorageError(e);
    log.error('storage.open_failed', { code: err.code });
    throw err;
  }
}

/** Pede armazenamento persistente; null quando a API não existe. */
export async function requestPersistence(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persist) return null;
  try {
    const granted = await storage.persist();
    log.debug('storage.persist', { granted });
    return granted;
  } catch {
    return null;
  }
}

/** Espaço usado e cota, em bytes, quando o navegador informa. */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await storage.estimate();
    return { usage, quota };
  } catch {
    return null;
  }
}

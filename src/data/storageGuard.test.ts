import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dexie } from 'dexie';
import { AppError } from '../lib/errors';
import { GastosDB } from './db';
import {
  guard,
  openDatabase,
  requestPersistence,
  storageEstimate,
  toStorageError,
} from './storageGuard';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TI-12 — Abertura com IndexedDB indisponível (camada de dados)', () => {
  it('sem a API do IndexedDB, falha com storage_unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(openDatabase(new GastosDB('teste-ausente'))).rejects.toMatchObject({
      code: 'storage_unavailable',
      message: 'Não foi possível salvar no aparelho. Tente de novo.',
    });
  });

  it('quando o banco não abre, a exceção do Dexie vira AppError', async () => {
    const database = new GastosDB('teste-bloqueado');
    const openFailed = Object.assign(new Error('bloqueado'), { name: 'OpenFailedError' });
    vi.spyOn(database, 'open').mockRejectedValue(openFailed as unknown as Dexie);
    const err = await openDatabase(database).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('storage_unavailable');
  });

  it('abre normalmente quando disponível', async () => {
    const database = new GastosDB('teste-ok');
    await expect(openDatabase(database)).resolves.toBeUndefined();
    database.close();
  });
});

describe('storageGuard', () => {
  it('toStorageError mantém AppError e detecta cota', () => {
    const e = new AppError('wallet_name_taken');
    expect(toStorageError(e)).toBe(e);
    expect(toStorageError(Object.assign(new Error(), { name: 'QuotaExceededError' })).code).toBe(
      'storage_quota',
    );
    expect(toStorageError(new Error('x')).code).toBe('storage_unavailable');
    expect(toStorageError(null).code).toBe('storage_unavailable');
  });

  it('guard repassa o resultado e traduz falhas', async () => {
    await expect(guard('ok', async () => 1)).resolves.toBe(1);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      guard('falha', async () => {
        throw new Error('x');
      }),
    ).rejects.toMatchObject({ code: 'storage_unavailable' });
    await expect(
      guard('nome', async () => {
        throw new AppError('wallet_name_taken');
      }),
    ).rejects.toMatchObject({ code: 'wallet_name_taken' });
  });

  it('requestPersistence e storageEstimate', async () => {
    vi.stubGlobal('navigator', { storage: undefined });
    expect(await requestPersistence()).toBeNull();
    expect(await storageEstimate()).toBeNull();

    vi.stubGlobal('navigator', {
      storage: { persist: async () => true, estimate: async () => ({ usage: 10, quota: 100 }) },
    });
    expect(await requestPersistence()).toBe(true);
    expect(await storageEstimate()).toEqual({ usage: 10, quota: 100 });

    vi.stubGlobal('navigator', {
      storage: {
        persist: async () => {
          throw new Error();
        },
        estimate: async () => {
          throw new Error();
        },
      },
    });
    expect(await requestPersistence()).toBeNull();
    expect(await storageEstimate()).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../test/factories';
import { db } from './db';
import { settingsRepository } from './settingsRepository';
import { walletRepository } from './walletRepository';

beforeEach(resetDb);

describe('settingsRepository', () => {
  it('no primeiro uso cria a carteira padrão "Pessoal" e as preferências', async () => {
    const s = await settingsRepository.ensureInitialized();
    const wallets = await walletRepository.list();
    expect(wallets).toHaveLength(1);
    expect(wallets[0]).toMatchObject({ name: 'Pessoal', isSample: false });
    expect(s).toEqual({
      id: 'app',
      activeWalletId: wallets[0]!.id,
      onboardingDone: false,
      persistenceGranted: null,
      lastExportAt: null,
    });
  });

  it('chamadas simultâneas não duplicam a carteira padrão', async () => {
    await Promise.all([
      settingsRepository.ensureInitialized(),
      settingsRepository.ensureInitialized(),
    ]);
    expect(await db.wallets.count()).toBe(1);
  });

  it('é idempotente e mantém a carteira ativa', async () => {
    const first = await settingsRepository.ensureInitialized();
    const viagem = await walletRepository.create('Viagem');
    await settingsRepository.setActiveWallet(viagem.id);
    const again = await settingsRepository.ensureInitialized();
    expect(again.activeWalletId).toBe(viagem.id);
    expect(again.id).toBe(first.id);
  });

  it('se a carteira ativa sumiu, ativa outra existente', async () => {
    const s = await settingsRepository.ensureInitialized();
    const casa = await walletRepository.create('Casa');
    await walletRepository.remove(s.activeWalletId);
    const fixed = await settingsRepository.ensureInitialized();
    expect(fixed.activeWalletId).toBe(casa.id);
  });

  it('update e wipeAll', async () => {
    await settingsRepository.ensureInitialized();
    await settingsRepository.update({ onboardingDone: true });
    expect((await settingsRepository.get())?.onboardingDone).toBe(true);
    await settingsRepository.wipeAll();
    expect(await settingsRepository.get()).toBeUndefined();
    expect(await db.wallets.count()).toBe(0);
  });

  it('nome de carteira vazio é rejeitado', async () => {
    await expect(walletRepository.create('   ')).rejects.toMatchObject({ code: 'invalid_name' });
  });
});

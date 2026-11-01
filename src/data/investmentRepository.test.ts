import { beforeEach, describe, expect, it } from 'vitest';
import { today } from '../domain/dates';
import { buildPortfolio, DEFAULT_MARKET_REFS } from '../domain/investments';
import { resetDb } from '../test/factories';
import { db } from './db';
import { investmentRepository as repo } from './investmentRepository';
import { createSampleInvestments } from './sampleInvestments';
import { settingsRepository } from './settingsRepository';

beforeEach(resetDb);

const CDB = { name: 'CDB', type: 'renda-fixa' as const, rate: null, maturity: null };

describe('investmentRepository', () => {
  it('cadastrar um investimento existente cria o aporte e o saldo informado', async () => {
    const inv = await repo.create(CDB, {
      appliedCents: 1000_00,
      appliedOn: '2026-01-10',
      balanceCents: 1080_00,
      balanceOn: '2026-06-30',
    });
    const entries = await db.investmentEntries.where('investmentId').equals(inv.id).toArray();
    expect(entries.map((e) => [e.kind, e.date, e.amountCents, e.month])).toEqual(
      expect.arrayContaining([
        ['aporte', '2026-01-10', 1000_00, '2026-01'],
        ['saldo', '2026-06-30', 1080_00, '2026-06'],
      ]),
    );
  });

  it('saldo igual ao aplicado não cria movimentação extra', async () => {
    const inv = await repo.create(CDB, {
      appliedCents: 500_00,
      appliedOn: '2026-01-10',
      balanceCents: 500_00,
      balanceOn: '2026-02-01',
    });
    expect(await db.investmentEntries.where('investmentId').equals(inv.id).count()).toBe(1);
  });

  it('dados inválidos não gravam nada', async () => {
    await expect(
      repo.create(
        { ...CDB, name: '' },
        {
          appliedCents: 1,
          appliedOn: '2026-01-01',
          balanceCents: null,
          balanceOn: '2026-01-01',
        },
      ),
    ).rejects.toMatchObject({ code: 'invalid_input' });
    expect(await db.investments.count()).toBe(0);
  });

  it('lança, edita e exclui movimentações; excluir o ativo leva as movimentações', async () => {
    const inv = await repo.create(CDB, {
      appliedCents: 100_00,
      appliedOn: '2026-01-01',
      balanceCents: null,
      balanceOn: '2026-01-01',
    });
    const e = await repo.addEntry({
      investmentId: inv.id,
      date: '2026-02-01',
      kind: 'aporte',
      amountCents: 50_00,
      note: 'bônus',
    });
    await repo.updateEntry(e.id, { ...e, kind: 'resgate', amountCents: 20_00 });
    expect(await db.investmentEntries.get(e.id)).toMatchObject({
      kind: 'resgate',
      amountCents: 20_00,
    });
    await repo.removeEntry(e.id);
    expect(await db.investmentEntries.count()).toBe(1);

    await expect(
      repo.addEntry({
        investmentId: 'nao-existe',
        date: '2026-02-01',
        kind: 'aporte',
        amountCents: 1,
        note: null,
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    await repo.update(inv.id, { ...CDB, name: 'CDB Novo', rate: { kind: 'cdi', value: 105 } });
    expect(await db.investments.get(inv.id)).toMatchObject({ name: 'CDB Novo' });
    await repo.remove(inv.id);
    expect(await db.investments.count()).toBe(0);
    expect(await db.investmentEntries.count()).toBe(0);
  });

  it('taxas de referência: padrão, gravação e validação', async () => {
    expect(await repo.getRefs()).toEqual(DEFAULT_MARKET_REFS);
    await repo.setRefs({ cdi: 13.65, ipca: 4.1 });
    expect(await repo.getRefs()).toEqual({ cdi: 13.65, ipca: 4.1 });
    await expect(repo.setRefs({ cdi: Number.NaN, ipca: 1 })).rejects.toMatchObject({
      code: 'invalid_input',
    });
  });

  it('exemplo: gera histórico de ~14 meses e sai sem tocar nos dados do usuário', async () => {
    const mine = await repo.create(CDB, {
      appliedCents: 100_00,
      appliedOn: '2026-01-01',
      balanceCents: null,
      balanceOn: '2026-01-01',
    });
    await createSampleInvestments();
    const all = await db.investments.toArray();
    expect(all.filter((i) => i.isSample).length).toBeGreaterThanOrEqual(5);
    const entries = await db.investmentEntries.toArray();
    expect(entries.every((e) => e.date <= today())).toBe(true);
    const p = buildPortfolio(all, entries, DEFAULT_MARKET_REFS);
    expect(p.history.length).toBeGreaterThanOrEqual(13);
    expect(p.totals.valueCents).toBeGreaterThan(p.totals.appliedCents);

    await repo.removeSamples();
    expect((await db.investments.toArray()).map((i) => i.id)).toEqual([mine.id]);
    expect(await db.investmentEntries.count()).toBe(1);
  });

  it('apagar tudo do aparelho também apaga os investimentos', async () => {
    await createSampleInvestments();
    await repo.setRefs({ cdi: 10, ipca: 4 });
    await settingsRepository.wipeAll();
    expect(await db.investments.count()).toBe(0);
    expect(await db.investmentEntries.count()).toBe(0);
    expect(await db.marketRefs.count()).toBe(0);
  });
});

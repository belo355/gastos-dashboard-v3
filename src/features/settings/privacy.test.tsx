import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';
import { budgetRepository } from '../../data/budgetRepository';
import { db } from '../../data/db';
import { expenseRepository } from '../../data/expenseRepository';
import { createSampleWallet } from '../../data/sampleData';
import { settingsRepository } from '../../data/settingsRepository';
import { today } from '../../domain/dates';
import { readyApp, resetDb } from '../../test/factories';
import { needsExportReminder } from './ExportReminder';

describe('TI-11 — WipeData apaga tudo e volta ao primeiro uso', () => {
  beforeEach(readyApp);

  it('após confirmar, as tabelas ficam vazias, onboardingDone = false e uma nova carteira padrão é criada', async () => {
    const user = userEvent.setup();
    const s = await settingsRepository.get();
    const oldWallet = s!.activeWalletId;
    await expenseRepository.create({
      walletId: oldWallet,
      date: today(),
      categoryId: 'lazer',
      amountCents: 1000,
      description: null,
    });
    await budgetRepository.setLimit(oldWallet, 'lazer', '2026-10', 5000);

    render(<App initialPath="/mais/apagar" />);
    await user.click(await screen.findByRole('button', { name: 'Apagar do aparelho' }));
    const confirm = within(
      await screen.findByRole('alertdialog', { name: 'Apagar todos os dados?' }),
    );
    await user.click(confirm.getByRole('button', { name: 'Apagar tudo' }));

    expect(
      await screen.findByRole('heading', { name: 'Lance seus gastos em segundos' }),
    ).toBeInTheDocument();
    expect(await db.expenses.count()).toBe(0);
    expect(await db.budgets.count()).toBe(0);
    await waitFor(async () => {
      const settings = await settingsRepository.get();
      expect(settings?.onboardingDone).toBe(false);
      const wallets = await db.wallets.toArray();
      expect(wallets).toHaveLength(1);
      expect(wallets[0]!.name).toBe('Pessoal');
      expect(wallets[0]!.id).not.toBe(oldWallet);
    });
  });

  it('cancelar não apaga nada', async () => {
    const user = userEvent.setup();
    render(<App initialPath="/mais/apagar" />);
    await user.click(await screen.findByRole('button', { name: 'Apagar do aparelho' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }),
    );
    expect(await db.wallets.count()).toBe(1);
    expect((await settingsRepository.get())?.onboardingDone).toBe(true);
  });
});

describe('boas-vindas', () => {
  beforeEach(resetDb);

  it('3 passos com aviso de privacidade; "Ver um exemplo" cria a carteira fictícia', async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    expect(await screen.findByText('Passo 1 de 3')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-notice')).toHaveTextContent(
      'Seus dados ficam só neste aparelho.',
    );
    await user.click(screen.getByRole('button', { name: 'Próximo' }));
    await user.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver um exemplo com dados fictícios' }));

    expect(await screen.findByTestId('sample-banner')).toHaveTextContent(
      'Exemplo · dados fictícios',
    );
    expect(await screen.findAllByTestId('ranking-row')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /Exemplo/, pressed: true })).toBeInTheDocument();
  });

  it('"Começar vazio" vai para o resumo vazio', async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    await user.click(await screen.findByRole('button', { name: 'Pular' }));
    await user.click(screen.getByRole('button', { name: 'Começar vazio' }));
    expect(await screen.findByText(/Nenhum gasto em .* ainda\./)).toBeInTheDocument();
    expect(await db.wallets.count()).toBe(1);
  });
});

describe('dados de exemplo e privacidade', () => {
  beforeEach(readyApp);

  it('a carteira de exemplo tem nome único, isSample e vira a ativa', async () => {
    const a = await createSampleWallet();
    const b = await createSampleWallet();
    expect([a.name, b.name]).toEqual(['Exemplo', 'Exemplo 2']);
    expect(a.isSample).toBe(true);
    expect((await settingsRepository.get())?.activeWalletId).toBe(b.id);
    expect(await db.expenses.where('walletId').equals(a.id).count()).toBeGreaterThan(10);
    expect(await db.budgets.where('walletId').equals(a.id).count()).toBe(2);
  });

  it('tela de privacidade explica o armazenamento local', async () => {
    render(<App initialPath="/mais/privacidade" />);
    expect(
      await screen.findByRole('heading', { name: 'Seus dados ficam só neste aparelho' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/limpar os dados do navegador/)).toBeInTheDocument();
    expect(screen.getByTestId('persistence-status')).toBeInTheDocument();
  });

  it('lembrete de exportação após 30 dias', () => {
    const now = Date.parse('2026-10-30T00:00:00Z');
    expect(needsExportReminder(null, null, now)).toBe(false);
    expect(needsExportReminder(null, '2026-10-20T00:00:00Z', now)).toBe(false);
    expect(needsExportReminder(null, '2026-09-01T00:00:00Z', now)).toBe(true);
    expect(needsExportReminder('2026-10-10T00:00:00Z', '2026-01-01T00:00:00Z', now)).toBe(false);
    expect(needsExportReminder('2026-09-20T00:00:00Z', '2026-01-01T00:00:00Z', now)).toBe(true);
  });
});

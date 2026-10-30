import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import * as guard from './data/storageGuard';
import { readyApp } from './test/factories';

beforeEach(readyApp);
afterEach(() => vi.restoreAllMocks());

describe('App', () => {
  it('abre com a navegação principal e o botão Lançar', async () => {
    render(<App initialPath="/" />);
    expect(
      await screen.findByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('launch-button')).toHaveAccessibleName('Lançar');
    for (const name of ['Resumo', 'Lançamentos', 'Orçamento', 'Mais']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });
});

describe('TI-12 — Abertura com IndexedDB indisponível', () => {
  it('mostra a tela de erro de armazenamento, sem exceção não tratada', async () => {
    const { AppError } = await import('./lib/errors');
    vi.spyOn(guard, 'openDatabase').mockRejectedValue(new AppError('storage_unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App initialPath="/" />);
    expect(
      await screen.findByRole('heading', { name: 'Não foi possível abrir seus dados' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Não foi possível salvar no aparelho. Tente de novo.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});

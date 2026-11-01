import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setTheme, THEME_KEY } from '../../lib/theme';
import { AppearanceSection } from './AppearanceSection';

describe('AppearanceSection', () => {
  afterEach(() => setTheme('system'));

  it('começa em Automático e marca a opção escolhida', async () => {
    render(<AppearanceSection />);
    const group = screen.getByRole('radiogroup', { name: 'Aparência' });
    expect(screen.getByRole('radio', { name: 'Automático' })).toBeChecked();
    expect(group).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Escuro' }));
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Automático' })).not.toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('Automático remove o tema fixo e a chave salva', async () => {
    setTheme('light');
    render(<AppearanceSection />);
    await userEvent.click(screen.getByRole('radio', { name: 'Automático' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('setas trocam a opção, como num grupo de rádio', () => {
    render(<AppearanceSection />);
    const auto = screen.getByRole('radio', { name: 'Automático' });
    expect(auto).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(auto, { key: 'ArrowDown' });
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Claro' }), { key: 'ArrowUp' });
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Automático' }), { key: 'ArrowUp' });
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  });
});

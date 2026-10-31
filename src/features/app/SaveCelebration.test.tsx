import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAVED_EVENT, type SavedDetail } from '../../hooks/useSaveExpense';
import { SaveCelebration } from './SaveCelebration';

function fire(detail: SavedDetail) {
  act(() => {
    window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail }));
  });
}

describe('SaveCelebration', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mostra valor e categoria de um lançamento novo e some sozinha', () => {
    vi.useFakeTimers();
    render(<SaveCelebration />);
    fire({ categoryId: 'mercado', amountCents: 2550, created: true });

    const card = screen.getByTestId('save-celebration');
    expect(card).toHaveAttribute('aria-hidden', 'true');
    expect(card).toHaveTextContent('Mercado');
    expect(card.textContent).toMatch(/25,50/);

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.queryByTestId('save-celebration')).toBeNull();
  });

  it('não aparece ao editar um lançamento', () => {
    render(<SaveCelebration />);
    fire({ categoryId: 'mercado', amountCents: 100, created: false });
    expect(screen.queryByTestId('save-celebration')).toBeNull();
  });

  it('não aparece com "reduzir movimento"', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    render(<SaveCelebration />);
    fire({ categoryId: 'lazer', amountCents: 100, created: true });
    expect(screen.queryByTestId('save-celebration')).toBeNull();
  });
});

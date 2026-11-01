import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Sheet';

/** visualViewport falso: o jsdom não tem, e é ele que encolhe quando o teclado do iOS abre. */
function fakeViewport(height: number) {
  const target = new EventTarget();
  const vv = Object.assign(target, { height, offsetTop: 0 });
  vi.stubGlobal('visualViewport', vv);
  return vv;
}

describe('Modal com teclado virtual', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('o fundo acompanha a área visível, deixando a sheet acima do teclado', () => {
    const vv = fakeViewport(844);
    render(
      <Modal open title="Limite de Mercado" onClose={() => {}}>
        <input aria-label="Limite" data-autofocus />
      </Modal>,
    );
    const overlay = screen.getByRole('dialog').parentElement!;
    expect(overlay.style.height).toBe('844px');

    // Teclado abre: a área visível encolhe e a página rola um pouco.
    act(() => {
      vv.height = 500;
      vv.offsetTop = 40;
      vv.dispatchEvent(new Event('resize'));
    });
    expect(overlay.style.height).toBe('500px');
    expect(overlay.style.top).toBe('40px');
    expect(screen.getByLabelText('Limite')).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('limpa os ajustes ao fechar', () => {
    fakeViewport(500);
    const { rerender } = render(
      <Modal open title="T" onClose={() => {}}>
        <input aria-label="Campo" />
      </Modal>,
    );
    const overlay = screen.getByRole('dialog').parentElement!;
    expect(overlay.style.height).toBe('500px');
    rerender(
      <Modal open={false} title="T" onClose={() => {}}>
        <input aria-label="Campo" />
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

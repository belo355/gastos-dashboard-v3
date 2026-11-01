import { useSyncExternalStore } from 'react';

/** "system" segue o aparelho; "light" e "dark" fixam o tema. */
export type ThemePref = 'system' | 'light' | 'dark';

/** Mesma chave lida por public/theme-init.js, que aplica o tema antes da primeira pintura. */
export const THEME_KEY = 'gastos:tema';

/** Cor da barra do navegador em cada tema (igual a --bg em tokens.css). */
const BAR_COLOR = { light: '#f2f2f7', dark: '#000000' } as const;

const listeners = new Set<() => void>();

function isPref(v: unknown): v is ThemePref {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function readTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isPref(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Aplica no <html> (data-theme) e ajusta a cor da barra do navegador. */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;

  // As duas metas usam media queries do sistema; com tema fixo, as duas recebem a mesma cor.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = BAR_COLOR[pref === 'system' ? scheme : pref];
  }
}

/** Guarda a escolha neste aparelho (sem o armazenamento, vale só até fechar o app). */
export function setTheme(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Armazenamento bloqueado: o tema ainda é aplicado nesta sessão.
  }
  current = pref;
  applyTheme(pref);
  listeners.forEach((l) => l());
}

let current: ThemePref | null = null;

export function useTheme(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (current ??= readTheme()),
  );
}

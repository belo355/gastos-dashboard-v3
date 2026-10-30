import { describe, expect, it } from 'vitest';
import { validateWalletName, walletSlug } from './walletName';

const existing = [
  { id: 'a', name: 'Casa' },
  { id: 'b', name: 'Viagem à Bahia' },
];

describe('TU-17 — Validação de nome de carteira', () => {
  it('"casa" conflita com "Casa"', () => {
    expect(validateWalletName('casa', existing)).toEqual({
      ok: false,
      error: 'wallet_name_taken',
      message: 'Já existe uma carteira com esse nome',
    });
    expect(validateWalletName('  CASA ', existing).ok).toBe(false);
    expect(validateWalletName('viagem a bahia', existing).ok).toBe(false);
  });

  it('vazio ou só espaços → invalid_name', () => {
    expect(validateWalletName('', existing)).toMatchObject({
      ok: false,
      error: 'invalid_name',
      message: 'Informe o nome da carteira',
    });
    expect(validateWalletName('    ', existing)).toMatchObject({
      ok: false,
      error: 'invalid_name',
    });
  });

  it('41 caracteres é rejeitado; 40 é aceito', () => {
    expect(validateWalletName('a'.repeat(41), existing)).toMatchObject({
      ok: false,
      error: 'too_long',
    });
    expect(validateWalletName('a'.repeat(40), existing)).toEqual({
      ok: true,
      value: 'a'.repeat(40),
    });
  });

  it('apara e aceita nome novo; ao renomear ignora a própria carteira', () => {
    expect(validateWalletName('  Pessoal  ', existing)).toEqual({ ok: true, value: 'Pessoal' });
    expect(validateWalletName('casa', existing, 'a')).toEqual({ ok: true, value: 'casa' });
  });

  it('gera slug para arquivos', () => {
    expect(walletSlug('Viagem à Bahia!')).toBe('viagem-a-bahia');
    expect(walletSlug('***')).toBe('carteira');
  });
});

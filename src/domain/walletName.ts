import { normalizeText } from './categories';

export const WALLET_NAME_MAX = 40;

export type WalletNameError = 'invalid_name' | 'too_long' | 'wallet_name_taken';

export const WALLET_NAME_MESSAGES: Record<WalletNameError, string> = {
  invalid_name: 'Informe o nome da carteira',
  too_long: `Use até ${WALLET_NAME_MAX} caracteres`,
  wallet_name_taken: 'Já existe uma carteira com esse nome',
};

/** Chave de comparação: sem diferenciar maiúsculas, acentos e espaços repetidos. */
export function walletNameKey(name: string): string {
  return normalizeText(name).replace(/\s+/g, ' ');
}

/**
 * Valida o nome de uma carteira contra as existentes.
 * `selfId` ignora a própria carteira ao renomear.
 */
export function validateWalletName(
  name: string,
  existing: readonly { id: string; name: string }[],
  selfId?: string,
): { ok: true; value: string } | { ok: false; error: WalletNameError; message: string } {
  const value = name.trim().replace(/\s+/g, ' ');
  const fail = (error: WalletNameError) => ({
    ok: false as const,
    error,
    message: WALLET_NAME_MESSAGES[error],
  });
  if (!value) return fail('invalid_name');
  if (value.length > WALLET_NAME_MAX) return fail('too_long');
  const key = walletNameKey(value);
  if (existing.some((w) => w.id !== selfId && walletNameKey(w.name) === key))
    return fail('wallet_name_taken');
  return { ok: true, value };
}

/** "Viagem à Bahia!" → "viagem-a-bahia" (para nomes de arquivo). */
export function walletSlug(name: string): string {
  return (
    walletNameKey(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'carteira'
  );
}

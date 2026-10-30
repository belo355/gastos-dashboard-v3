import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyInput, parseMoney, reaisToCents } from './money';

describe('TU-01 — parseMoney aceita formatos pt-BR', () => {
  it.each([
    ['25,90', 2590],
    ['1.234,56', 123456],
    ['R$ 5', 500],
    ['R$ 25,90', 2590],
    ['R$\u00a01.234,56', 123456],
    ['0,5', 50],
    ['12.5', 1250],
    ['1.234', 123400],
    ['999.999,99', 99_999_999],
  ])('%s → %i', (text, cents) => {
    expect(parseMoney(text)).toBe(cents);
  });

  it.each(['', '0', '0,00', 'abc', '-3', '1,2,3', '1,234', '12.345.6', '1.000.000,00', '  '])(
    '%j → null',
    (text) => {
      expect(parseMoney(text)).toBeNull();
    },
  );
});

describe('TU-02 — formatMoney formata em BRL', () => {
  it('formata milhar e decimal', () => {
    expect(formatMoney(123456)).toBe('R$ 1.234,56');
    expect(formatMoney(0)).toBe('R$ 0,00');
    expect(formatMoney(18000)).toBe('R$ 180,00');
  });

  it('formata valor para edição sem símbolo', () => {
    expect(formatMoneyInput(2590)).toBe('25,90');
  });

  it('converte reais de planilha para centavos', () => {
    expect(reaisToCents(25.9)).toBe(2590);
    expect(reaisToCents(0)).toBeNull();
    expect(reaisToCents(Number.NaN)).toBeNull();
    expect(reaisToCents(-1)).toBeNull();
  });
});

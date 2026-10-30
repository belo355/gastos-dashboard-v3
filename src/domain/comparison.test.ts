import { describe, expect, it } from 'vitest';
import { compareMonths } from './comparison';

describe('TU-07 — compareMonths cobre mais, menos, igual e sem anterior', () => {
  it('menos', () => {
    expect(compareMonths(184590, 196590)).toEqual({
      deltaCents: -12000,
      deltaPercent: -6.1,
      direction: 'less',
    });
  });

  it('mais', () => {
    expect(compareMonths(15000, 10000)).toEqual({
      deltaCents: 5000,
      deltaPercent: 50,
      direction: 'more',
    });
  });

  it('igual', () => {
    expect(compareMonths(10000, 10000)).toEqual({
      deltaCents: 0,
      deltaPercent: 0,
      direction: 'equal',
    });
  });

  it('sem anterior', () => {
    expect(compareMonths(184590, 0)).toEqual({
      deltaCents: 184590,
      deltaPercent: null,
      direction: 'no_previous',
    });
  });

  it('variação muito pequena negativa não vira -0', () => {
    expect(Object.is(compareMonths(999999, 1000000).deltaPercent, -0)).toBe(false);
  });
});

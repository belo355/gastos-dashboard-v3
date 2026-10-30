import { describe, expect, it } from 'vitest';
import { CATEGORIES, getCategory, isCategoryId, matchCategory } from './categories';

describe('catálogo de categorias', () => {
  it('tem as 12 categorias do PRD, com cor e ícone distintos', () => {
    expect(CATEGORIES.map((c) => c.name)).toEqual([
      'Alimentação',
      'Mercado',
      'Moradia',
      'Transporte',
      'Carro',
      'Saúde',
      'Educação',
      'Lazer',
      'Jogos',
      'Vestuário',
      'Família',
      'Outros',
    ]);
    expect(new Set(CATEGORIES.map((c) => c.icon)).size).toBe(12);
    expect(new Set(CATEGORIES.map((c) => c.colorVar)).size).toBe(12);
  });

  it('getCategory e isCategoryId', () => {
    expect(getCategory('mercado').colorVar).toBe('--cat-mercado');
    expect(isCategoryId('saude')).toBe(true);
    expect(isCategoryId('pets')).toBe(false);
  });
});

describe('TU-16 — matchCategory normaliza acento e caixa', () => {
  it.each(['SAÚDE', 'saude', 'Saúde ', ' saúde'])('%j → saude', (text) => {
    expect(matchCategory(text)).toEqual({ id: 'saude', recognized: true });
  });

  it('reconhece pelo id', () => {
    expect(matchCategory('alimentacao').id).toBe('alimentacao');
    expect(matchCategory('Família').id).toBe('familia');
  });

  it.each(['Pets', '', null, 42])('%j → outros', (text) => {
    expect(matchCategory(text)).toEqual({ id: 'outros', recognized: false });
  });
});

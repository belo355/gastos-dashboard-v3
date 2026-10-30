import type { MonthComparison } from './types';

const round1 = (x: number) => Math.round(x * 10) / 10;

export function compareMonths(currentCents: number, previousCents: number): MonthComparison {
  const deltaCents = currentCents - previousCents;
  if (previousCents <= 0) {
    return { deltaCents, deltaPercent: null, direction: 'no_previous' };
  }
  const deltaPercent = round1((deltaCents / previousCents) * 100);
  const direction = deltaCents > 0 ? 'more' : deltaCents < 0 ? 'less' : 'equal';
  return { deltaCents, deltaPercent: Object.is(deltaPercent, -0) ? 0 : deltaPercent, direction };
}

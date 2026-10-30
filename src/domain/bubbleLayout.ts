import { hierarchy, pack } from 'd3-hierarchy';
import type { CategoryId } from './categories';
import type { CategoryTotal } from './types';

export interface BubbleNode {
  categoryId: CategoryId;
  totalCents: number;
  percent: number;
  x: number;
  y: number;
  r: number;
}

type Datum = { children?: CategoryTotal[] } | CategoryTotal;

/**
 * Posiciona uma bolha por categoria, com área proporcional ao valor e sem sobreposição
 * (layout `pack` do d3-hierarchy, determinístico).
 */
export function layoutBubbles(
  items: readonly CategoryTotal[],
  width: number,
  height: number,
  padding = 4,
): BubbleNode[] {
  const data = items.filter((i) => i.totalCents > 0);
  if (data.length === 0 || width <= 0 || height <= 0) return [];

  const size = Math.min(width, height);
  const root = hierarchy<Datum>({ children: [...data] })
    .sum((d) => ('totalCents' in d ? d.totalCents : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const packed = pack<Datum>().size([size, size]).padding(padding)(root);
  const dx = (width - size) / 2;
  const dy = (height - size) / 2;

  return packed.leaves().map((leaf) => {
    const d = leaf.data as CategoryTotal;
    return {
      categoryId: d.categoryId,
      totalCents: d.totalCents,
      percent: d.percent,
      x: leaf.x + dx,
      y: leaf.y + dy,
      r: leaf.r,
    };
  });
}

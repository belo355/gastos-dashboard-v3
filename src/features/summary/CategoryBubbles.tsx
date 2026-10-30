import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { LazyMotion, m } from 'motion/react';

const loadFeatures = () => import('./motionFeatures').then((r) => r.default);
import { layoutBubbles, type BubbleNode } from '../../domain/bubbleLayout';
import { getCategory } from '../../domain/categories';
import type { CategoryTotal } from '../../domain/types';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';
import { formatPercent } from '../../lib/format';
import { CategoryGlyph, categoryColor } from '../../ui/CategoryIcon';

const SPRING = { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 } as const;

function useWidth(fallback = 340) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth > 0) setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Bolhas proporcionais por categoria (área ∝ valor). A visualização é decorativa
 * para leitores de tela: o ranking em lista logo abaixo é o equivalente acessível.
 */
export function CategoryBubbles({ categories }: { categories: CategoryTotal[] }) {
  const { ref, width } = useWidth();
  const height = Math.round(Math.min(width, 340));
  const nodes = useMemo(
    () => layoutBubbles(categories, width, height, 5),
    [categories, width, height],
  );
  const reduced = useReducedMotionPref();
  const navigate = useNavigate();

  const label = `Distribuição dos gastos por categoria: ${categories
    .map((c) => `${getCategory(c.categoryId).name} ${formatPercent(c.percent)}`)
    .join(', ')}.`;

  return (
    <div ref={ref} className="w-full">
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        data-motion={reduced ? 'off' : 'on'}
        data-testid="category-bubbles"
        className="block overflow-visible"
      >
        <LazyMotion features={loadFeatures} strict>
          {nodes.map((n) => (
            <Bubble
              key={n.categoryId}
              node={n}
              reduced={reduced}
              onSelect={() => navigate(`/lancamentos?categoria=${n.categoryId}`)}
            />
          ))}
        </LazyMotion>
      </svg>
    </div>
  );
}

function Bubble({
  node,
  reduced,
  onSelect,
}: {
  node: BubbleNode;
  reduced: boolean;
  onSelect: () => void;
}) {
  const cat = getCategory(node.categoryId);
  const iconSize = Math.max(12, Math.min(34, node.r * 0.62));
  const showText = node.r >= 26;
  const showName = node.r >= 46;
  const content = (
    <>
      <title>{`${cat.name}: ${formatPercent(node.percent)}`}</title>
      <circle r={node.r} fill={categoryColor(node.categoryId)} />
      <CategoryGlyph
        id={node.categoryId}
        x={-iconSize / 2}
        y={showText ? -iconSize / 2 - (showName ? node.r * 0.3 : node.r * 0.18) : -iconSize / 2}
        width={iconSize}
        height={iconSize}
        color="var(--cat-ink)"
        strokeWidth={2.25}
        aria-hidden
      />
      {showText && (
        <text
          y={showName ? node.r * 0.2 : node.r * 0.42}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--cat-ink)"
          fontWeight={800}
          fontSize={Math.max(11, Math.min(22, node.r * 0.32))}
        >
          {formatPercent(node.percent)}
        </text>
      )}
      {showName && (
        <text
          y={node.r * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--cat-ink)"
          fontWeight={600}
          fontSize={Math.max(10, Math.min(15, node.r * 0.2))}
        >
          {cat.name}
        </text>
      )}
    </>
  );

  const common = {
    'data-testid': 'bubble',
    'data-category': node.categoryId,
    style: { cursor: 'pointer' },
    onClick: onSelect,
  };

  if (reduced) {
    return (
      <g transform={`translate(${node.x} ${node.y})`} {...common}>
        {content}
      </g>
    );
  }
  return (
    <m.g
      initial={{ x: node.x, y: node.y, scale: 0, opacity: 0 }}
      animate={{ x: node.x, y: node.y, scale: 1, opacity: 1 }}
      transition={SPRING}
      {...common}
    >
      {content}
    </m.g>
  );
}

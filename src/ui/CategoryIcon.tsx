import {
  Bus,
  Car,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  PartyPopper,
  Shapes,
  Shirt,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import { getCategory, type CategoryId } from '../domain/categories';

const ICONS: Record<CategoryId, LucideIcon> = {
  alimentacao: UtensilsCrossed,
  mercado: ShoppingCart,
  moradia: House,
  transporte: Bus,
  carro: Car,
  saude: HeartPulse,
  educacao: GraduationCap,
  lazer: PartyPopper,
  jogos: Gamepad2,
  vestuario: Shirt,
  familia: Users,
  outros: Shapes,
};

export function categoryIcon(id: CategoryId): LucideIcon {
  return ICONS[id];
}

/** Ícone da categoria sem fundo (aceita as props de um ícone lucide, ex.: x/y dentro de um SVG). */
export function CategoryGlyph({ id, ...props }: { id: CategoryId } & LucideProps) {
  return createElement(ICONS[id], props);
}

export function categoryColor(id: CategoryId): string {
  return `var(${getCategory(id).colorVar})`;
}

/**
 * Ícone da categoria num quadrado arredondado com a cor dela, como os ícones dos Ajustes do iOS
 * (decorativo: o nome sempre acompanha).
 */
export function CategoryBadge({ id, size = 40 }: { id: CategoryId; size?: number }) {
  return (
    <TileIcon size={size} color={categoryColor(id)}>
      <CategoryGlyph id={id} size={Math.round(size * 0.58)} strokeWidth={2.25} />
    </TileIcon>
  );
}

/** Quadrado arredondado colorido com um ícone branco/preto (cor do texto das categorias). */
export function TileIcon({
  size = 30,
  color,
  children,
}: {
  size?: number;
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        background: color,
        color: 'var(--cat-ink)',
      }}
    >
      {children}
    </span>
  );
}

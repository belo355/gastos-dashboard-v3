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
import { createElement } from 'react';
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

/** Ícone da categoria num círculo com a cor dela (decorativo: o nome sempre acompanha). */
export function CategoryBadge({ id, size = 40 }: { id: CategoryId; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: categoryColor(id), color: 'var(--cat-ink)' }}
    >
      <CategoryGlyph id={id} size={Math.round(size * 0.5)} strokeWidth={2.25} />
    </span>
  );
}

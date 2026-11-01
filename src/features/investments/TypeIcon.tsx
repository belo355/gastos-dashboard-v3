import {
  BadgePercent,
  Bitcoin,
  Building2,
  ChartCandlestick,
  Landmark,
  Layers,
  Shapes,
  Umbrella,
  type LucideIcon,
} from 'lucide-react';
import { getInvestmentType, type InvestmentTypeId } from '../../domain/investments';
import { TileIcon } from '../../ui/CategoryIcon';

const ICONS: Record<InvestmentTypeId, LucideIcon> = {
  'renda-fixa': BadgePercent,
  tesouro: Landmark,
  acoes: ChartCandlestick,
  fiis: Building2,
  fundos: Layers,
  cripto: Bitcoin,
  previdencia: Umbrella,
  outros: Shapes,
};

export function typeColor(id: InvestmentTypeId): string {
  return `var(${getInvestmentType(id).colorVar})`;
}

/** Ícone do tipo de investimento num quadrado arredondado com a cor dele (decorativo). */
export function TypeIcon({ type, size = 30 }: { type: InvestmentTypeId; size?: number }) {
  const Icon = ICONS[type];
  return (
    <TileIcon size={size} color={typeColor(type)}>
      <Icon aria-hidden size={Math.round(size * 0.58)} strokeWidth={2.25} />
    </TileIcon>
  );
}

export const CATEGORY_IDS = [
  'alimentacao',
  'mercado',
  'moradia',
  'transporte',
  'carro',
  'saude',
  'educacao',
  'lazer',
  'jogos',
  'vestuario',
  'familia',
  'outros',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  id: CategoryId;
  name: string;
  /** Nome do ícone em lucide-react. */
  icon: string;
  /** Token CSS da cor (claro/escuro em tokens.css). */
  colorVar: string;
}

const NAMES: Record<CategoryId, [name: string, icon: string]> = {
  alimentacao: ['Alimentação', 'UtensilsCrossed'],
  mercado: ['Mercado', 'ShoppingCart'],
  moradia: ['Moradia', 'House'],
  transporte: ['Transporte', 'Bus'],
  carro: ['Carro', 'Car'],
  saude: ['Saúde', 'HeartPulse'],
  educacao: ['Educação', 'GraduationCap'],
  lazer: ['Lazer', 'PartyPopper'],
  jogos: ['Jogos', 'Gamepad2'],
  vestuario: ['Vestuário', 'Shirt'],
  familia: ['Família', 'Users'],
  outros: ['Outros', 'Shapes'],
};

export const CATEGORIES: readonly Category[] = CATEGORY_IDS.map((id) => ({
  id,
  name: NAMES[id][0],
  icon: NAMES[id][1],
  colorVar: `--cat-${id}`,
}));

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  return BY_ID.get(id)!;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value as CategoryId);
}

/** Minúsculas, sem acento e sem espaços nas pontas. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

const BY_NORMALIZED = new Map<string, CategoryId>();
for (const c of CATEGORIES) {
  BY_NORMALIZED.set(normalizeText(c.name), c.id);
  BY_NORMALIZED.set(c.id, c.id);
}

/** Reconhece a categoria pelo nome ou id; o que não for reconhecido vira "outros". */
export function matchCategory(text: unknown): { id: CategoryId; recognized: boolean } {
  if (typeof text !== 'string') return { id: 'outros', recognized: false };
  const id = BY_NORMALIZED.get(normalizeText(text));
  return id ? { id, recognized: true } : { id: 'outros', recognized: false };
}

/** Compara nomes de categoria para desempate estável em pt-BR. */
export function compareCategoryNames(a: CategoryId, b: CategoryId): number {
  return getCategory(a).name.localeCompare(getCategory(b).name, 'pt-BR');
}

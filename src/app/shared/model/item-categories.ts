export const ITEM_CATEGORIES = [
  'Hortifruti',
  'Carnes',
  'Laticínios',
  'Padaria',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Congelados',
  'Mercearia',
  'Outros',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const DEFAULT_CATEGORY: ItemCategory = 'Outros';

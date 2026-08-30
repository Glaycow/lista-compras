import {Shopping} from './Shopping';
import {ShoppingItem} from './ShoppingItem';

export interface ShoppingBackup {
  version: 1;
  exportedAt: string;
  shopping: Shopping[];
  items: ShoppingItem[];
}

export function isShoppingBackup(value: unknown): value is ShoppingBackup {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ShoppingBackup>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.shopping) &&
    Array.isArray(candidate.items)
  );
}

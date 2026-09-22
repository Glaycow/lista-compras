import {Shopping} from './Shopping';
import {ShoppingItem} from './ShoppingItem';

export interface ShoppingBackup {
  version: 1 | 2;
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
    (candidate.version === 1 || candidate.version === 2) &&
    Array.isArray(candidate.shopping) &&
    Array.isArray(candidate.items)
  );
}

export interface ShoppingListBackup {
  version: 1;
  exportedAt: string;
  shopping: Shopping;
  items: ShoppingItem[];
}

export function isShoppingListBackup(value: unknown): value is ShoppingListBackup {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ShoppingListBackup>;
  return (
    candidate.version === 1 &&
    typeof candidate.shopping === 'object' &&
    candidate.shopping !== null &&
    Array.isArray(candidate.items)
  );
}

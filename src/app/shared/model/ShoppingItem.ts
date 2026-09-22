import {ItemCategory} from './item-categories';

export interface ShoppingItem {
  id?: number;
  shoppingId: number;
  nome: string;
  marca?: string;
  quantidade: number;
  valor: number;
  itemMarcado: boolean;
  categoria?: ItemCategory;
  ordem?: number;
}


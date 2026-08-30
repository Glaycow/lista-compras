import {Injectable} from '@angular/core';
import Dexie, {Table} from 'dexie';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

@Injectable({ providedIn: 'root' })
export class DbConfig extends Dexie {
  shopping!: Table<Shopping, number>;
  shoppingItem!: Table<ShoppingItem, number>;

  constructor() {
    super('shopping');
    this.version(1).stores({
      shopping: '++id, nome, data',
      shoppingItem: '++id,shoppingId, nome, marcar, quantidade, valor, itemMarcado',
    });
    this.version(2).stores({
      shopping: '++id, nome, data',
      shoppingItem: '++id, shoppingId, nome, marca, quantidade, valor, itemMarcado',
    });
  }
}

import {inject, Injectable} from '@angular/core';
import {liveQuery} from 'dexie';
import {DbConfig} from '../db/db-config';
import {isShoppingBackup, ShoppingBackup} from '../model/ShoppingBackup';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

@Injectable({ providedIn: 'root' })
export class ShoppingService {
  private readonly db = inject(DbConfig);
  public readonly shopping = liveQuery(() => this.db.shopping.toArray());

  public getShoppingItensByShoppingId(shoppingId: number): Promise<ShoppingItem[]> {
    return this.db.shoppingItem.where('shoppingId').equals(shoppingId).toArray();
  }

  public async create(compra: Shopping): Promise<number> {
    return this.db.shopping.add(compra);
  }

  public async remove(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      await this.db.shoppingItem.where('shoppingId').equals(id).delete();
      await this.db.shopping.delete(id);
    });
  }

  public async update(compra: Shopping): Promise<number> {
    return this.db.shopping.update(compra.id!, compra);
  }

  public async getById(id: number): Promise<Shopping | undefined> {
    return this.db.shopping.get(id);
  }

  public async exportData(): Promise<ShoppingBackup> {
    const [shopping, items] = await Promise.all([
      this.db.shopping.toArray(),
      this.db.shoppingItem.toArray(),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      shopping,
      items,
    };
  }

  public async importData(payload: unknown): Promise<void> {
    if (!isShoppingBackup(payload)) {
      throw new Error('Arquivo de backup inválido.');
    }

    const shopping = payload.shopping.map((entry) => ({
      ...entry,
      data: new Date(entry.data),
    }));

    await this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      await this.db.shopping.clear();
      await this.db.shoppingItem.clear();
      if (shopping.length > 0) {
        await this.db.shopping.bulkAdd(shopping);
      }
      if (payload.items.length > 0) {
        await this.db.shoppingItem.bulkAdd(payload.items);
      }
    });
  }
}

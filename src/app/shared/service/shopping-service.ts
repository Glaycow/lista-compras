import {inject, Injectable} from '@angular/core';
import {liveQuery} from 'dexie';
import {DbConfig} from '../db/db-config';
import {
  isShoppingBackup,
  isShoppingListBackup,
  ShoppingBackup,
  ShoppingListBackup,
} from '../model/ShoppingBackup';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';
import {SHOPPING_TEMPLATES, ShoppingTemplate} from '../model/shopping-templates';

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

  public async restore(shopping: Shopping, items: ShoppingItem[]): Promise<void> {
    await this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      const shoppingId = await this.db.shopping.add(shopping);
      if (items.length > 0) {
        await this.db.shoppingItem.bulkAdd(
          items.map((item) => ({...item, shoppingId, id: undefined})),
        );
      }
    });
  }

  public async update(compra: Shopping): Promise<number> {
    return this.db.shopping.update(compra.id!, compra);
  }

  public async getById(id: number): Promise<Shopping | undefined> {
    return this.db.shopping.get(id);
  }

  public async duplicate(id: number): Promise<number> {
    const shopping = await this.getById(id);
    if (!shopping) {
      throw new Error('Lista não encontrada.');
    }

    const items = await this.getShoppingItensByShoppingId(id);
    const newShopping: Shopping = {
      nome: `${shopping.nome} (cópia)`,
      data: new Date(),
      orcamento: shopping.orcamento,
    };

    return this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      const newId = await this.db.shopping.add(newShopping);
      if (items.length > 0) {
        await this.db.shoppingItem.bulkAdd(
          items.map((item, index) => ({
            shoppingId: newId,
            nome: item.nome,
            marca: item.marca,
            quantidade: item.quantidade,
            valor: item.valor,
            itemMarcado: false,
            categoria: item.categoria,
            ordem: item.ordem ?? index,
          })),
        );
      }
      return newId;
    });
  }

  public async createFromTemplate(template: ShoppingTemplate): Promise<number> {
    const shopping: Shopping = {
      nome: template.nome,
      data: new Date(),
    };

    return this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      const shoppingId = await this.db.shopping.add(shopping);
      if (template.itens.length > 0) {
        await this.db.shoppingItem.bulkAdd(
          template.itens.map((item, index) => ({
            shoppingId,
            nome: item.nome,
            marca: item.marca,
            quantidade: item.quantidade,
            valor: item.valor,
            itemMarcado: false,
            categoria: item.categoria,
            ordem: index,
          })),
        );
      }
      return shoppingId;
    });
  }

  public getTemplates(): ShoppingTemplate[] {
    return SHOPPING_TEMPLATES;
  }

  public async exportData(): Promise<ShoppingBackup> {
    const [shopping, items] = await Promise.all([
      this.db.shopping.toArray(),
      this.db.shoppingItem.toArray(),
    ]);
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      shopping,
      items,
    };
  }

  public async exportList(id: number): Promise<ShoppingListBackup> {
    const shopping = await this.getById(id);
    if (!shopping) {
      throw new Error('Lista não encontrada.');
    }
    const items = await this.getShoppingItensByShoppingId(id);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      shopping,
      items,
    };
  }

  public async importData(payload: unknown, merge = false): Promise<void> {
    if (!isShoppingBackup(payload)) {
      throw new Error('Arquivo de backup inválido.');
    }

    const shopping = payload.shopping.map((entry) => ({
      ...entry,
      data: new Date(entry.data),
    }));

    if (merge) {
      await this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
        const idMap = new Map<number, number>();
        for (const entry of shopping) {
          const oldId = entry.id;
          const rest = {...entry};
          delete rest.id;
          const newId = await this.db.shopping.add(rest);
          if (oldId !== undefined) {
            idMap.set(oldId, newId);
          }
        }

        const items = payload.items
          .filter((item) => idMap.has(item.shoppingId))
          .map((item) => ({...item, id: undefined, shoppingId: idMap.get(item.shoppingId)!}));
        if (items.length > 0) {
          await this.db.shoppingItem.bulkAdd(items);
        }
      });
      return;
    }

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

  public async importList(payload: unknown): Promise<number> {
    if (!isShoppingListBackup(payload)) {
      throw new Error('Arquivo de lista inválido.');
    }

    const shopping: Shopping = {...payload.shopping, data: new Date(payload.shopping.data)};
    delete shopping.id;

    return this.db.transaction('rw', this.db.shopping, this.db.shoppingItem, async () => {
      const newId = await this.db.shopping.add(shopping);
      if (payload.items.length > 0) {
        await this.db.shoppingItem.bulkAdd(
          payload.items.map((item) => ({...item, id: undefined, shoppingId: newId})),
        );
      }
      return newId;
    });
  }
}

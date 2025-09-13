import {Injectable, signal} from '@angular/core';
import {DbConfig} from '../db/db-config';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

@Injectable({ providedIn: 'root' })
export class ShoppingItensService {
  private readonly db = new DbConfig();
  private readonly listaItens = signal<ShoppingItem[]>([]);
  shoppingItens = this.listaItens;

  public async getShoppingById(id: number): Promise<Shopping | undefined> {
    return this.db.shopping.filter((shopping) => shopping.id == id).first();
  }

  public async getShoppingItensByShoppingId(shoppingId: number): Promise<void> {
    await this.db.shoppingItem.filter((shoppingItem => shoppingItem.shoppingId == shoppingId)).toArray().then(
      (shoppingItems) => {
        this.listaItens.set(shoppingItems);
      }
    );
  }

  public async geyById(id: number): Promise<ShoppingItem | undefined> {
    return this.db.shoppingItem.filter((shoppingItem) => shoppingItem.id == id).first();
  }

  public async create(itens: ShoppingItem): Promise<number> {
   delete itens.id;
   return  this.db.shoppingItem.add(itens);
  }

  public async remove(id: number): Promise<void> {
    return this.db.shoppingItem.delete(id);
  }

  public async update(itens: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.filter((shoppingItem) => shoppingItem.id == itens.id!).modify(itens);
  }

  public async updateItemMarcado(item: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.filter((shoppingItem) => shoppingItem.id == item.id!).modify({ itemMarcado: !item.itemMarcado});
  }
}

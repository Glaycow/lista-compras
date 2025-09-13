import {inject, Injectable} from '@angular/core';
import {liveQuery} from 'dexie';
import {DbConfig} from '../db/db-config';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';
import {ShoppingItensService} from './shopping-itens-service';


@Injectable({ providedIn: 'root' })
export class ShoppingService {
  private readonly db = new DbConfig();
  private readonly shoppingItensService = inject(ShoppingItensService);
  public readonly shopping = liveQuery(() => this.db.shopping.toArray());

  public getShoppingItensByShoppingId(shoppingId: number): Promise<ShoppingItem[]> {
    return this.db.shoppingItem.filter((shoppingItem) => shoppingItem.shoppingId == shoppingId).toArray();
  }

  public async create(compra: Shopping): Promise<number> {
    return this.db.shopping.add(compra);
  }

  public async remove(id: number): Promise<void> {
    await this.shoppingItensService.getShoppingItensByShoppingId(id);
    const itensShopping = this.shoppingItensService.shoppingItens();
    if(itensShopping.length > 0) {
      for (const shopping1 of itensShopping) {
        await this.shoppingItensService.remove(shopping1.id!);
      }
    }

    return this.db.shopping.delete(id);
  }

  public async update(compra: Shopping): Promise<number> {
    return this.db.shopping.filter((shopping) => shopping.id == compra.id!).modify(compra);
  }

  public async getById(id: number): Promise<Shopping | undefined>  {
    return this.db.shopping.filter((shopping) => shopping.id == id).first();
  }

}

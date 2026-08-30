import {inject, Injectable, signal} from '@angular/core';
import {DbConfig} from '../db/db-config';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

@Injectable({ providedIn: 'root' })
export class ShoppingItensService {
  private readonly db = inject(DbConfig);
  private readonly listaItens = signal<ShoppingItem[]>([]);
  shoppingItens = this.listaItens;

  public async getShoppingById(id: number): Promise<Shopping | undefined> {
    return this.db.shopping.get(id);
  }

  public async getShoppingItensByShoppingId(shoppingId: number): Promise<void> {
    const shoppingItems = await this.db.shoppingItem
      .where('shoppingId')
      .equals(shoppingId)
      .toArray();
    this.listaItens.set(this.ordenarPorMarcado(shoppingItems));
  }

  public async getById(id: number): Promise<ShoppingItem | undefined> {
    return this.db.shoppingItem.get(id);
  }

  public async create(itens: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.add({
      shoppingId: itens.shoppingId,
      nome: itens.nome,
      marca: itens.marca,
      quantidade: itens.quantidade,
      valor: itens.valor,
      itemMarcado: itens.itemMarcado,
    });
  }

  public async remove(id: number): Promise<void> {
    return this.db.shoppingItem.delete(id);
  }

  public async update(itens: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.update(itens.id!, itens);
  }

  public async updateItemMarcado(item: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.update(item.id!, {itemMarcado: !item.itemMarcado});
  }

  private ordenarPorMarcado(itens: ShoppingItem[]): ShoppingItem[] {
    return [...itens].sort((a, b) => {
      if (a.itemMarcado !== b.itemMarcado) {
        return a.itemMarcado ? 1 : -1;
      }

      const nomeCompare = a.nome.localeCompare(b.nome);
      if (nomeCompare !== 0) return nomeCompare;

      return (a.marca || '').localeCompare(b.marca || '');
    });
  }
}

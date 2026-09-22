import {inject, Injectable} from '@angular/core';
import {liveQuery} from 'dexie';
import {DbConfig} from '../db/db-config';
import {DEFAULT_CATEGORY} from '../model/item-categories';
import {PriceHistory} from '../model/PriceHistory';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

export interface FrequentItem {
  nome: string;
  marca?: string;
  valor: number;
  categoria?: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ShoppingItensService {
  private readonly db = inject(DbConfig);

  public watchItems(shoppingId: number) {
    return liveQuery(() =>
      this.db.shoppingItem
        .where('shoppingId')
        .equals(shoppingId)
        .toArray()
        .then((items) => this.sortItems(items)),
    );
  }

  public async getShoppingById(id: number): Promise<Shopping | undefined> {
    return this.db.shopping.get(id);
  }

  public async getShoppingItensByShoppingId(shoppingId: number): Promise<ShoppingItem[]> {
    const items = await this.db.shoppingItem.where('shoppingId').equals(shoppingId).toArray();
    return this.sortItems(items);
  }

  public async getById(id: number): Promise<ShoppingItem | undefined> {
    return this.db.shoppingItem.get(id);
  }

  public async create(itens: ShoppingItem): Promise<number> {
    const id = await this.db.shoppingItem.add({
      shoppingId: itens.shoppingId,
      nome: itens.nome,
      marca: itens.marca,
      quantidade: itens.quantidade,
      valor: itens.valor,
      itemMarcado: itens.itemMarcado,
      categoria: itens.categoria ?? DEFAULT_CATEGORY,
      ordem: itens.ordem,
    });
    await this.recordPrice(itens.nome, itens.marca, itens.valor);
    return id;
  }

  public async remove(id: number): Promise<ShoppingItem | undefined> {
    const item = await this.getById(id);
    if (item) {
      await this.db.shoppingItem.delete(id);
    }
    return item;
  }

  public async restore(item: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.add(item);
  }

  public async update(itens: ShoppingItem): Promise<number> {
    const result = await this.db.shoppingItem.update(itens.id!, itens);
    await this.recordPrice(itens.nome, itens.marca, itens.valor);
    return result;
  }

  public async updateItemMarcado(item: ShoppingItem): Promise<number> {
    return this.db.shoppingItem.update(item.id!, {itemMarcado: !item.itemMarcado});
  }

  public async reorderItems(shoppingId: number, orderedIds: number[]): Promise<void> {
    await this.db.transaction('rw', this.db.shoppingItem, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.db.shoppingItem.update(orderedIds[i], {ordem: i});
      }
    });
  }

  public async getFrequentItems(limit = 8): Promise<FrequentItem[]> {
    const items = await this.db.shoppingItem.toArray();
    const map = new Map<string, FrequentItem>();

    for (const item of items) {
      const key = `${item.nome.toLowerCase()}|${(item.marca ?? '').toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.valor = item.valor;
      } else {
        map.set(key, {
          nome: item.nome,
          marca: item.marca,
          valor: item.valor,
          categoria: item.categoria,
          count: 1,
        });
      }
    }

    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public async getLastPrice(nome: string, marca?: string): Promise<PriceHistory | undefined> {
    const all = await this.db.priceHistory
      .where('nome')
      .equalsIgnoreCase(nome)
      .toArray();

    const filtered = all
      .filter((entry) => (entry.marca ?? '') === (marca ?? ''))
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());

    return filtered[0];
  }

  public async getPriceHistory(nome: string, marca?: string, limit = 5): Promise<PriceHistory[]> {
    const all = await this.db.priceHistory
      .where('nome')
      .equalsIgnoreCase(nome)
      .toArray();

    return all
      .filter((entry) => (entry.marca ?? '') === (marca ?? ''))
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
      .slice(0, limit);
  }

  private async recordPrice(nome: string, marca: string | undefined, valor: number): Promise<void> {
    await this.db.priceHistory.add({
      nome,
      marca,
      valor,
      registeredAt: new Date(),
    });
  }

  private sortItems(itens: ShoppingItem[]): ShoppingItem[] {
    const hasManualOrder = itens.some((i) => i.ordem !== undefined);
    return [...itens].sort((a, b) => {
      if (hasManualOrder) {
        const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
        const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
        if (ordemA !== ordemB) return ordemA - ordemB;
      }

      if (a.itemMarcado !== b.itemMarcado) {
        return a.itemMarcado ? 1 : -1;
      }

      const nomeCompare = a.nome.localeCompare(b.nome);
      if (nomeCompare !== 0) return nomeCompare;

      return (a.marca || '').localeCompare(b.marca || '');
    });
  }
}

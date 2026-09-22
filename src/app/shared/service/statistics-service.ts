import {inject, Injectable} from '@angular/core';
import {DbConfig} from '../db/db-config';
import {MonthlySpending, PriceEvolution, TopPurchasedItem} from '../model/statistics';
import {ShoppingItem} from '../model/ShoppingItem';

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

@Injectable({providedIn: 'root'})
export class StatisticsService {
  private readonly db = inject(DbConfig);

  public async getMonthlySpending(): Promise<MonthlySpending[]> {
    const [shoppings, items] = await Promise.all([
      this.db.shopping.toArray(),
      this.db.shoppingItem.toArray(),
    ]);

    const itemsByShopping = new Map<number, ShoppingItem[]>();
    for (const item of items) {
      const list = itemsByShopping.get(item.shoppingId) ?? [];
      list.push(item);
      itemsByShopping.set(item.shoppingId, list);
    }

    const byMonth = new Map<string, {total: number; listIds: Set<number>}>();
    for (const shopping of shoppings) {
      if (!shopping.id) continue;
      const date = new Date(shopping.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const shoppingItems = itemsByShopping.get(shopping.id) ?? [];
      const spent = shoppingItems.reduce(
        (acc, i) => acc + (i.itemMarcado ? i.valor * i.quantidade : 0),
        0,
      );
      const entry = byMonth.get(key) ?? {total: 0, listIds: new Set<number>()};
      entry.total += spent;
      entry.listIds.add(shopping.id);
      byMonth.set(key, entry);
    }

    return [...byMonth.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([monthKey, data]) => ({
        monthKey,
        label: formatMonthLabel(monthKey),
        total: data.total,
        listCount: data.listIds.size,
      }));
  }

  public async getTopPurchasedItems(limit = 10): Promise<TopPurchasedItem[]> {
    const items = await this.db.shoppingItem.toArray();
    const map = new Map<string, TopPurchasedItem>();

    for (const item of items) {
      const key = `${item.nome.toLowerCase()}|${(item.marca ?? '').toLowerCase()}`;
      const spent = item.valor * item.quantidade;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.totalSpent += spent;
        existing.lastPrice = item.valor;
      } else {
        map.set(key, {
          nome: item.nome,
          marca: item.marca,
          count: 1,
          totalSpent: spent,
          lastPrice: item.valor,
        });
      }
    }

    return [...map.values()]
      .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  public async getPriceEvolutions(limit = 8): Promise<PriceEvolution[]> {
    const all = await this.db.priceHistory.toArray();
    const groups = new Map<string, typeof all>();

    for (const entry of all) {
      const key = `${entry.nome.toLowerCase()}|${(entry.marca ?? '').toLowerCase()}`;
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }

    const evolutions: PriceEvolution[] = [];
    for (const entries of groups.values()) {
      if (entries.length < 2) continue;
      const sorted = [...entries].sort(
        (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const changePct = first.valor === 0
        ? 0
        : ((last.valor - first.valor) / first.valor) * 100;

      evolutions.push({
        nome: last.nome,
        marca: last.marca,
        firstPrice: first.valor,
        lastPrice: last.valor,
        changePct,
        history: sorted,
      });
    }

    return evolutions
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, limit);
  }
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const idx = Number(month) - 1;
  return `${MONTH_LABELS[idx] ?? month}/${year}`;
}

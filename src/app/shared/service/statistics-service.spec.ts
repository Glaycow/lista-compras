import {TestBed} from '@angular/core/testing';
import {StatisticsService} from './statistics-service';
import {DbConfig} from '../db/db-config';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('StatisticsService', () => {
  let service: StatisticsService;
  let db: DbConfig;

  beforeEach(async () => {
    await deleteShoppingDb();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatisticsService);
    db = TestBed.inject(DbConfig);
  });

  it('should compute monthly spending from marked items', async () => {
    const shoppingId = await db.shopping.add({
      nome: 'Feira',
      data: new Date('2026-03-15'),
    });
    await db.shoppingItem.bulkAdd([
      {shoppingId, nome: 'Arroz', quantidade: 2, valor: 10, itemMarcado: true},
      {shoppingId, nome: 'Feijão', quantidade: 1, valor: 8, itemMarcado: false},
    ]);

    const monthly = await service.getMonthlySpending();
    expect(monthly).toHaveLength(1);
    expect(monthly[0].total).toBe(20);
    expect(monthly[0].label).toContain('Mar');
    expect(monthly[0].listCount).toBe(1);
  });

  it('should return top purchased items sorted by count', async () => {
    const shoppingId = await db.shopping.add({nome: 'Lista', data: new Date()});
    await db.shoppingItem.bulkAdd([
      {shoppingId, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: false},
      {shoppingId, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: false},
      {shoppingId, nome: 'Pão', quantidade: 1, valor: 4, itemMarcado: false},
    ]);

    const top = await service.getTopPurchasedItems();
    expect(top[0].nome).toBe('Leite');
    expect(top[0].count).toBe(2);
    expect(top[0].totalSpent).toBe(10);
  });

  it('should return price evolutions for products with multiple entries', async () => {
    await db.priceHistory.bulkAdd([
      {nome: 'Arroz', valor: 20, registeredAt: new Date('2026-01-01')},
      {nome: 'Arroz', valor: 25, registeredAt: new Date('2026-03-01')},
      {nome: 'Feijão', valor: 8, registeredAt: new Date('2026-01-01')},
    ]);

    const evolutions = await service.getPriceEvolutions();
    expect(evolutions).toHaveLength(1);
    expect(evolutions[0].nome).toBe('Arroz');
    expect(evolutions[0].firstPrice).toBe(20);
    expect(evolutions[0].lastPrice).toBe(25);
    expect(evolutions[0].changePct).toBe(25);
  });

  it('should return empty arrays when there is no data', async () => {
    expect(await service.getMonthlySpending()).toEqual([]);
    expect(await service.getTopPurchasedItems()).toEqual([]);
    expect(await service.getPriceEvolutions()).toEqual([]);
  });
});

import {TestBed} from '@angular/core/testing';
import {ShoppingItensService} from './shopping-itens-service';
import {ShoppingItem} from '../model/ShoppingItem';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

async function collectItems(service: ShoppingItensService, shoppingId: number): Promise<ShoppingItem[]> {
  return new Promise((resolve) => {
    const sub = service.watchItems(shoppingId).subscribe((items) => {
      resolve(items);
      sub.unsubscribe();
    });
  });
}

describe('ShoppingItensService', () => {
  let service: ShoppingItensService;

  beforeEach(async () => {
    await deleteShoppingDb();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingItensService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an item and return its id', async () => {
    const item: ShoppingItem = {
      shoppingId: 1,
      nome: 'Arroz',
      quantidade: 2,
      valor: 5.5,
      itemMarcado: false,
    };
    const id = await service.create(item);
    expect(id).toBeGreaterThan(0);
  });

  it('should create an item and then retrieve it by id', async () => {
    const item: ShoppingItem = {
      shoppingId: 1,
      nome: 'Feijão',
      quantidade: 1,
      valor: 8.0,
      itemMarcado: false,
    };
    const id = await service.create(item);

    const found = await service.getById(id);
    expect(found).toBeTruthy();
    expect(found!.nome).toBe('Feijão');
    expect(found!.quantidade).toBe(1);
    expect(found!.valor).toBe(8.0);
  });

  it('should return undefined for non-existent item id', async () => {
    const result = await service.getById(999);
    expect(result).toBeUndefined();
  });

  it('should load items for a shopping via watchItems', async () => {
    const item1: ShoppingItem = { shoppingId: 1, nome: 'Item A', quantidade: 1, valor: 10, itemMarcado: false };
    const item2: ShoppingItem = { shoppingId: 1, nome: 'Item B', quantidade: 2, valor: 20, itemMarcado: true };
    await service.create(item1);
    await service.create(item2);

    const items = await collectItems(service, 1);
    expect(items).toHaveLength(2);
  });

  it('should sort items by marcado status and name', async () => {
    const itemA: ShoppingItem = { shoppingId: 1, nome: 'Item A', quantidade: 1, valor: 10, itemMarcado: false };
    const itemB: ShoppingItem = { shoppingId: 1, nome: 'Item B', quantidade: 1, valor: 10, itemMarcado: true };
    await service.create(itemA);
    await service.create(itemB);

    const items = await service.getShoppingItensByShoppingId(1);
    expect(items[0].itemMarcado).toBe(false);
    expect(items[1].itemMarcado).toBe(true);
  });

  it('should keep marked items after unmarked ones when the first compared item is marked', async () => {
    await service.create({shoppingId: 2, nome: 'Zebra', quantidade: 1, valor: 1, itemMarcado: true});
    await service.create({shoppingId: 2, nome: 'Abacaxi', quantidade: 1, valor: 1, itemMarcado: false});
    const items = await service.getShoppingItensByShoppingId(2);
    expect(items[0].nome).toBe('Abacaxi');
    expect(items[1].nome).toBe('Zebra');
  });

  it('should treat missing marca as empty when sorting', async () => {
    await service.create({shoppingId: 4, nome: 'Leite', quantidade: 1, valor: 1, itemMarcado: false, marca: 'B'});
    await service.create({shoppingId: 4, nome: 'Leite', quantidade: 1, valor: 1, itemMarcado: false});
    const items = await service.getShoppingItensByShoppingId(4);
    expect(items[0].marca).toBeUndefined();
    expect(items[1].marca).toBe('B');
  });

  it('should sort unmarked items by name then marca', async () => {
    await service.create({shoppingId: 1, nome: 'Leite', marca: 'B', quantidade: 1, valor: 1, itemMarcado: false});
    await service.create({shoppingId: 1, nome: 'Leite', marca: 'A', quantidade: 1, valor: 1, itemMarcado: false});
    await service.create({shoppingId: 1, nome: 'Arroz', marca: 'Z', quantidade: 1, valor: 1, itemMarcado: false});

    const items = await service.getShoppingItensByShoppingId(1);
    expect(items.map((item) => `${item.nome}-${item.marca}`)).toEqual([
      'Arroz-Z',
      'Leite-A',
      'Leite-B',
    ]);
  });

  it('should return empty array for non-existent shopping', async () => {
    const items = await service.getShoppingItensByShoppingId(999);
    expect(items).toEqual([]);
  });

  it('should update an existing item', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Original', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);

    await service.update({ id, shoppingId: 1, nome: 'Atualizado', quantidade: 3, valor: 15, itemMarcado: false });
    const found = await service.getById(id);
    expect(found!.nome).toBe('Atualizado');
    expect(found!.quantidade).toBe(3);
    expect(found!.valor).toBe(15);
  });

  it('should toggle itemMarcado from false to true', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);
    await service.updateItemMarcado({ id, shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: false });
    const found = await service.getById(id);
    expect(found!.itemMarcado).toBe(true);
  });

  it('should toggle itemMarcado from true to false', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: true };
    const id = await service.create(item);
    await service.updateItemMarcado({ id, shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: true });
    const found = await service.getById(id);
    expect(found!.itemMarcado).toBe(false);
  });

  it('should remove an item', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Remover', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);
    expect(await service.getById(id)).toBeTruthy();

    await service.remove(id);
    expect(await service.getById(id)).toBeUndefined();
  });

  it('should restore a removed item', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Restaurar', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);
    const removed = await service.remove(id);
    expect(removed).toBeTruthy();

    const restoredId = await service.restore(removed!);
    const found = await service.getById(restoredId);
    expect(found?.nome).toBe('Restaurar');
  });

  it('should record and retrieve price history', async () => {
    await service.create({shoppingId: 1, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: false});
    const last = await service.getLastPrice('Leite');
    expect(last?.valor).toBe(5);

    const history = await service.getPriceHistory('Leite');
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('should return frequent items', async () => {
    await service.create({shoppingId: 1, nome: 'Arroz', quantidade: 1, valor: 10, itemMarcado: false});
    await service.create({shoppingId: 1, nome: 'Arroz', quantidade: 1, valor: 10, itemMarcado: false});
    await service.create({shoppingId: 1, nome: 'Feijão', quantidade: 1, valor: 8, itemMarcado: false});

    const frequent = await service.getFrequentItems();
    expect(frequent[0].nome).toBe('Arroz');
    expect(frequent[0].count).toBe(2);
  });

  it('should reorder items', async () => {
    const id1 = await service.create({shoppingId: 1, nome: 'A', quantidade: 1, valor: 1, itemMarcado: false});
    const id2 = await service.create({shoppingId: 1, nome: 'B', quantidade: 1, valor: 1, itemMarcado: false});
    await service.reorderItems(1, [id2, id1]);
    const items = await service.getShoppingItensByShoppingId(1);
    expect(items[0].id).toBe(id2);
    expect(items[1].id).toBe(id1);
  });

  it('should handle a complete CRUD flow', async () => {
    const item1: ShoppingItem = { shoppingId: 1, nome: 'Arroz', quantidade: 5, valor: 28.9, itemMarcado: false };
    const id1 = await service.create(item1);
    expect(id1).toBeGreaterThan(0);

    const item2: ShoppingItem = { shoppingId: 1, nome: 'Feijão', quantidade: 2, valor: 15.5, itemMarcado: true };
    await service.create(item2);

    const items = await collectItems(service, 1);
    expect(items).toHaveLength(2);

    await service.update({ id: id1, shoppingId: 1, nome: 'Arroz Integral', quantidade: 5, valor: 32.9, itemMarcado: false });
    await service.updateItemMarcado({ id: id1, shoppingId: 1, nome: 'Arroz Integral', quantidade: 5, valor: 32.9, itemMarcado: false });
    const found = await service.getById(id1);
    expect(found!.itemMarcado).toBe(true);

    await service.remove(id1);
    expect(await service.getById(id1)).toBeUndefined();
  });
});

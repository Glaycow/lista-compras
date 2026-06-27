import {TestBed} from '@angular/core/testing';
import {ShoppingItensService} from './shopping-itens-service';
import {ShoppingItem} from '../model/ShoppingItem';

/** Helper: delete the IndexedDB 'shopping' database to ensure a clean state. */
async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // ignore blocked
  });
}

describe('ShoppingItensService', () => {
  let service: ShoppingItensService;

  beforeEach(async () => {
    await deleteShoppingDb();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingItensService);
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty shoppingItens signal', () => {
    expect(service.shoppingItens()).toEqual([]);
  });

  // ────────────────────────────
  //  getShoppingById
  // ────────────────────────────

  it('should return undefined for non-existent shopping', async () => {
    const result = await service.getShoppingById(999);
    expect(result).toBeUndefined();
  });

  // ────────────────────────────
  //  create
  // ────────────────────────────

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

    const found = await service.geyById(id);
    expect(found).toBeTruthy();
    expect(found!.nome).toBe('Feijão');
    expect(found!.quantidade).toBe(1);
    expect(found!.valor).toBe(8.0);
  });

  // ────────────────────────────
  //  geyById
  // ────────────────────────────

  it('should return undefined for non-existent item id', async () => {
    const result = await service.geyById(999);
    expect(result).toBeUndefined();
  });

  // ────────────────────────────
  //  getShoppingItensByShoppingId
  // ────────────────────────────

  it('should load items for a shopping and update the signal', async () => {
    const item1: ShoppingItem = { shoppingId: 1, nome: 'Item A', quantidade: 1, valor: 10, itemMarcado: false };
    const item2: ShoppingItem = { shoppingId: 1, nome: 'Item B', quantidade: 2, valor: 20, itemMarcado: true };
    await service.create(item1);
    await service.create(item2);

    await service.getShoppingItensByShoppingId(1);
    expect(service.shoppingItens()).toHaveLength(2);
  });

  it('should sort items by marcado status and name', async () => {
    const itemA: ShoppingItem = { shoppingId: 1, nome: 'Item A', quantidade: 1, valor: 10, itemMarcado: false };
    const itemB: ShoppingItem = { shoppingId: 1, nome: 'Item B', quantidade: 1, valor: 10, itemMarcado: true };
    await service.create(itemA);
    await service.create(itemB);

    await service.getShoppingItensByShoppingId(1);
    const items = service.shoppingItens();
    expect(items[0].itemMarcado).toBe(false);
    expect(items[1].itemMarcado).toBe(true);
  });

  it('should set empty array for non-existent shopping', async () => {
    await service.getShoppingItensByShoppingId(999);
    expect(service.shoppingItens()).toEqual([]);
  });

  // ────────────────────────────
  //  update
  // ────────────────────────────

  it('should update an existing item', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Original', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);

    await service.update({ id, shoppingId: 1, nome: 'Atualizado', quantidade: 3, valor: 15, itemMarcado: false });
    const found = await service.geyById(id);
    expect(found!.nome).toBe('Atualizado');
    expect(found!.quantidade).toBe(3);
    expect(found!.valor).toBe(15);
  });

  // ────────────────────────────
  //  updateItemMarcado (toggle)
  // ────────────────────────────

  it('should toggle itemMarcado from false to true', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);
    await service.updateItemMarcado({ id, shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: false });
    const found = await service.geyById(id);
    expect(found!.itemMarcado).toBe(true);
  });

  it('should toggle itemMarcado from true to false', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: true };
    const id = await service.create(item);
    await service.updateItemMarcado({ id, shoppingId: 1, nome: 'Item', quantidade: 1, valor: 10, itemMarcado: true });
    const found = await service.geyById(id);
    expect(found!.itemMarcado).toBe(false);
  });

  // ────────────────────────────
  //  remove
  // ────────────────────────────

  it('should remove an item', async () => {
    const item: ShoppingItem = { shoppingId: 1, nome: 'Remover', quantidade: 1, valor: 10, itemMarcado: false };
    const id = await service.create(item);
    expect(await service.geyById(id)).toBeTruthy();

    await service.remove(id);
    expect(await service.geyById(id)).toBeUndefined();
  });

  // ────────────────────────────
  //  Full flow: create, load, update, remove
  // ────────────────────────────

  it('should handle a complete CRUD flow', async () => {
    const item1: ShoppingItem = { shoppingId: 1, nome: 'Arroz', quantidade: 5, valor: 28.9, itemMarcado: false };
    const id1 = await service.create(item1);
    expect(id1).toBeGreaterThan(0);

    const item2: ShoppingItem = { shoppingId: 1, nome: 'Feijão', quantidade: 2, valor: 15.5, itemMarcado: true };
    await service.create(item2);

    await service.getShoppingItensByShoppingId(1);
    expect(service.shoppingItens()).toHaveLength(2);

    await service.update({ id: id1, shoppingId: 1, nome: 'Arroz Integral', quantidade: 5, valor: 32.9, itemMarcado: false });
    await service.updateItemMarcado({ id: id1, shoppingId: 1, nome: 'Arroz Integral', quantidade: 5, valor: 32.9, itemMarcado: false });
    const found = await service.geyById(id1);
    expect(found!.itemMarcado).toBe(true);

    await service.remove(id1);
    expect(await service.geyById(id1)).toBeUndefined();
  });
});

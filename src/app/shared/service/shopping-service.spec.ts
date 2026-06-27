import {TestBed} from '@angular/core/testing';
import {ShoppingService} from './shopping-service';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

describe('ShoppingService', () => {
  let service: ShoppingService;

  beforeEach(async () => {
    await deleteShoppingDb();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingService);
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a shopping liveQuery that returns an empty array initially', async () => {
    const items = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => {
        resolve(data);
        sub.unsubscribe();
      });
    });
    expect(items).toEqual([]);
  });

  // ────────────────────────────
  //  create
  // ────────────────────────────

  it('should create a shopping item and return its id', async () => {
    const shopping: Shopping = { nome: 'Feira', data: new Date('2026-01-15') };
    const id = await service.create(shopping);
    expect(id).toBeGreaterThan(0);
  });

  it('should create and retrieve the shopping', async () => {
    const shopping: Shopping = { nome: 'Mercado', data: new Date('2026-03-10') };
    const id = await service.create(shopping);

    const result = await service.getById(id);
    expect(result).toBeTruthy();
    expect(result!.nome).toBe('Mercado');
  });

  // ────────────────────────────
  //  getById
  // ────────────────────────────

  it('should return undefined for a non-existent id', async () => {
    const result = await service.getById(999);
    expect(result).toBeUndefined();
  });

  it('should return the shopping with the given id', async () => {
    const shopping: Shopping = { nome: 'Farmácia', data: new Date('2026-05-20') };
    const id = await service.create(shopping);

    const found = await service.getById(id);
    expect(found).toBeTruthy();
    expect(found!.id).toBe(id);
    expect(found!.nome).toBe('Farmácia');
  });

  // ────────────────────────────
  //  getShoppingItensByShoppingId
  // ────────────────────────────

  it('should return empty array for a shopping with no items', async () => {
    const shopping: Shopping = { nome: 'Vazia', data: new Date() };
    const id = await service.create(shopping);

    const items = await service.getShoppingItensByShoppingId(id);
    expect(items).toEqual([]);
  });

  // ────────────────────────────
  //  update
  // ────────────────────────────

  it('should update an existing shopping', async () => {
    const shopping: Shopping = { nome: 'Original', data: new Date('2026-01-01') };
    const id = await service.create(shopping);

    await service.update({ id, nome: 'Atualizado', data: new Date('2026-06-01') });
    const result = await service.getById(id);
    expect(result!.nome).toBe('Atualizado');
  });

  // ────────────────────────────
  //  remove
  // ────────────────────────────

  it('should remove a shopping', async () => {
    const shopping: Shopping = { nome: 'Remover', data: new Date() };
    const id = await service.create(shopping);

    await service.remove(id);
    const result = await service.getById(id);
    expect(result).toBeUndefined();
  });

  it('should remove a shopping with associated items', async () => {
    const shopping: Shopping = { nome: 'Com Itens', data: new Date() };
    const shoppingId = await service.create(shopping);

    const shoppingItensService = (service as unknown as { shoppingItensService: { create: (item: ShoppingItem) => Promise<number> } }).shoppingItensService;
    await shoppingItensService.create({
      shoppingId, nome: 'Item Teste', quantidade: 2, valor: 10, itemMarcado: false,
    });

    await service.remove(shoppingId);
    expect(await service.getById(shoppingId)).toBeUndefined();

    const items = await service.getShoppingItensByShoppingId(shoppingId);
    expect(items).toEqual([]);
  });

  it('should remove a shopping without items (empty itensShopping list)', async () => {
    const shopping: Shopping = { nome: 'Sem Itens', data: new Date() };
    const id = await service.create(shopping);

    await service.remove(id);
    const result = await service.getById(id);
    expect(result).toBeUndefined();
  });

  // ────────────────────────────
  //  liveQuery reactivity
  // ────────────────────────────

  it('should reflect newly created shopping in liveQuery', async () => {
    const shopping: Shopping = { nome: 'Nova', data: new Date() };
    await service.create(shopping);

    const items = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => {
        if (data.length > 0) {
          resolve(data);
          sub.unsubscribe();
        }
      });
    });

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((s) => s.nome === 'Nova')).toBe(true);
  });
});

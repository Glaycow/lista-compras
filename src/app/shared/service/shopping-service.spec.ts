import {TestBed} from '@angular/core/testing';
import {ShoppingService} from './shopping-service';
import {Shopping} from '../model/Shopping';
import {ShoppingItensService} from './shopping-itens-service';

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

    const shoppingItensService = TestBed.inject(ShoppingItensService);
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

  it('should export and import shopping data', async () => {
    const shoppingId = await service.create({ nome: 'Backup', data: new Date('2026-01-01') });
    await TestBed.inject(ShoppingItensService).create({
      shoppingId, nome: 'Leite', quantidade: 1, valor: 4, itemMarcado: false,
    });

    const backup = await service.exportData();
    expect(backup.version).toBe(2);
    expect(backup.shopping).toHaveLength(1);
    expect(backup.items).toHaveLength(1);

    await service.remove(shoppingId);
    expect(await service.getById(shoppingId)).toBeUndefined();

    await service.importData(backup);
    const restored = await service.getById(shoppingId);
    expect(restored?.nome).toBe('Backup');
    expect(await service.getShoppingItensByShoppingId(shoppingId)).toHaveLength(1);
  });

  it('should reject invalid backup payload', async () => {
    await expect(service.importData({ version: 2 })).rejects.toThrow('Arquivo de backup inválido.');
  });

  it('should import an empty backup', async () => {
    await service.create({nome: 'Temp', data: new Date()});
    await service.importData({
      version: 1,
      exportedAt: new Date().toISOString(),
      shopping: [],
      items: [],
    });
    expect(await service.getShoppingItensByShoppingId(1)).toEqual([]);
    const all = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => {
        resolve(data);
        sub.unsubscribe();
      });
    });
    expect(all).toEqual([]);
  });

  it('should duplicate a shopping list with items', async () => {
    const shoppingId = await service.create({nome: 'Original', data: new Date()});
    await TestBed.inject(ShoppingItensService).create({
      shoppingId, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: true,
    });

    const newId = await service.duplicate(shoppingId);
    const copy = await service.getById(newId);
    expect(copy?.nome).toBe('Original (cópia)');

    const items = await service.getShoppingItensByShoppingId(newId);
    expect(items).toHaveLength(1);
    expect(items[0].itemMarcado).toBe(false);
  });

  it('should export a single list', async () => {
    const shoppingId = await service.create({nome: 'Export', data: new Date()});
    const exported = await service.exportList(shoppingId);
    expect(exported.shopping.nome).toBe('Export');
    expect(exported.version).toBe(1);
  });

  it('should merge import data', async () => {
    const id1 = await service.create({nome: 'A', data: new Date()});
    await service.importData({
      version: 2,
      exportedAt: new Date().toISOString(),
      shopping: [{nome: 'B', data: new Date()}],
      items: [],
    }, true);

    const all = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => {
        resolve(data);
        sub.unsubscribe();
      });
    });
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(await service.getById(id1)).toBeTruthy();
  });

  it('should merge import data whose ids collide with existing records', async () => {
    const shoppingId = await service.create({nome: 'Original', data: new Date()});
    await TestBed.inject(ShoppingItensService).create({
      shoppingId, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: false,
    });

    const backup = await service.exportData();
    await service.importData(backup, true);

    const all = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => { resolve(data); sub.unsubscribe(); });
    });
    expect(all).toHaveLength(2);

    const merged = all.find((s) => s.id !== shoppingId);
    expect(merged).toBeTruthy();
    const mergedItems = await service.getShoppingItensByShoppingId(merged!.id!);
    expect(mergedItems).toHaveLength(1);
    expect(mergedItems[0].nome).toBe('Leite');

    const originalItems = await service.getShoppingItensByShoppingId(shoppingId);
    expect(originalItems).toHaveLength(1);
  });

  it('should import a single list backup as a new list', async () => {
    const shoppingId = await service.create({nome: 'Origem', data: new Date()});
    await TestBed.inject(ShoppingItensService).create({
      shoppingId, nome: 'Arroz', quantidade: 2, valor: 8, itemMarcado: false,
    });

    const backup = await service.exportList(shoppingId);
    const newId = await service.importList(backup);

    expect(newId).not.toBe(shoppingId);
    const imported = await service.getById(newId);
    expect(imported?.nome).toBe('Origem');
    const items = await service.getShoppingItensByShoppingId(newId);
    expect(items).toHaveLength(1);
    expect(items[0].nome).toBe('Arroz');

    const original = await service.getById(shoppingId);
    expect(original).toBeTruthy();
  });

  it('should reject an invalid single-list backup payload', async () => {
    await expect(service.importList({version: 1})).rejects.toThrow('Arquivo de lista inválido.');
  });

  it('should create from template', async () => {
    const template = service.getTemplates()[0];
    const id = await service.createFromTemplate(template);
    const items = await service.getShoppingItensByShoppingId(id);
    expect(items.length).toBe(template.itens.length);
  });

  it('should restore a deleted shopping', async () => {
    const shopping: Shopping = {nome: 'Restaurar', data: new Date()};
    const id = await service.create(shopping);
    const items = [{shoppingId: id, nome: 'Item', quantidade: 1, valor: 1, itemMarcado: false}];
    await service.remove(id);
    await service.restore({...shopping, id}, items);
    const all = await new Promise<Shopping[]>((resolve) => {
      const sub = service.shopping.subscribe((data) => {
        resolve(data);
        sub.unsubscribe();
      });
    });
    expect(all.some((s) => s.nome === 'Restaurar')).toBe(true);
  });

  it('should throw when duplicating non-existent list', async () => {
    await expect(service.duplicate(999)).rejects.toThrow('Lista não encontrada.');
  });

  it('should throw when exporting non-existent list', async () => {
    await expect(service.exportList(999)).rejects.toThrow('Lista não encontrada.');
  });
});

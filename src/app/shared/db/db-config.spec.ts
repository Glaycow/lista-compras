import {DbConfig} from './db-config';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

describe('DbConfig', () => {
  let db: DbConfig;

  beforeEach(() => {
    db = new DbConfig();
  });

  afterEach(async () => {
    // Clean up the database after each test
    await db.delete();
  });

  it('should create a new instance', () => {
    expect(db).toBeTruthy();
  });

  it('should have a shopping table', () => {
    expect(db.shopping).toBeTruthy();
  });

  it('should have a shoppingItem table', () => {
    expect(db.shoppingItem).toBeTruthy();
  });

  it('should be able to add and retrieve a shopping entry', async () => {
    const shopping: Shopping = { nome: 'Test Shopping', data: new Date('2026-01-01') };
    const id = await db.shopping.add(shopping);
    expect(id).toBeGreaterThan(0);

    const result = await db.shopping.get(id);
    expect(result).toBeTruthy();
    expect(result!.nome).toBe('Test Shopping');
  });

  it('should be able to add and retrieve a shopping item', async () => {
    const item: ShoppingItem = {
      shoppingId: 1,
      nome: 'Test Item',
      quantidade: 3,
      valor: 15.5,
      itemMarcado: false,
    };
    const id = await db.shoppingItem.add(item);
    expect(id).toBeGreaterThan(0);

    const result = await db.shoppingItem.get(id);
    expect(result).toBeTruthy();
    expect(result!.nome).toBe('Test Item');
    expect(result!.quantidade).toBe(3);
  });

  it('should list all shopping entries', async () => {
    await db.shopping.add({ nome: 'Lista 1', data: new Date() });
    await db.shopping.add({ nome: 'Lista 2', data: new Date() });

    const all = await db.shopping.toArray();
    expect(all).toHaveLength(2);
  });

  it('should delete a shopping entry', async () => {
    const id = await db.shopping.add({ nome: 'Para deletar', data: new Date() });
    await db.shopping.delete(id);

    const result = await db.shopping.get(id);
    expect(result).toBeUndefined();
  });

  it('should update a shopping entry using modify', async () => {
    const id = await db.shopping.add({ nome: 'Original', data: new Date('2026-01-01') });

    await db.shopping.where('id').equals(id).modify({ nome: 'Atualizado' });
    const result = await db.shopping.get(id);
    expect(result!.nome).toBe('Atualizado');
  });

  it('should filter shopping items by shoppingId', async () => {
    await db.shoppingItem.add({ shoppingId: 1, nome: 'Item 1', quantidade: 1, valor: 10, itemMarcado: false });
    await db.shoppingItem.add({ shoppingId: 1, nome: 'Item 2', quantidade: 2, valor: 20, itemMarcado: true });
    await db.shoppingItem.add({ shoppingId: 2, nome: 'Outro', quantidade: 1, valor: 5, itemMarcado: false });

    const itemsForShopping1 = await db.shoppingItem.where('shoppingId').equals(1).toArray();
    expect(itemsForShopping1).toHaveLength(2);

    const itemsForShopping2 = await db.shoppingItem.where('shoppingId').equals(2).toArray();
    expect(itemsForShopping2).toHaveLength(1);
  });
});

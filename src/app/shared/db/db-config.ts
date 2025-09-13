import Dexie, {Table} from 'dexie';
import {Shopping} from '../model/Shopping';
import {ShoppingItem} from '../model/ShoppingItem';

export class DbConfig extends Dexie {
  shopping!: Table<Shopping, number>;
  shoppingItem!: Table<ShoppingItem, number>;

  constructor() {
    super('shopping');
    this.version(1).stores({
      shopping: '++id, nome, data',
      shoppingItem: '++id,shoppingId, nome, marcar, quantidade, valor, itemMarcado',
    });
    //this.on('populate', () => this.populationsShopping())
  }

  private async populationsShopping(): Promise<void> {
    const listaInicio = await DbShoppingApp.shopping.add({
      nome: 'Teste',
      data: new Date()
    });

    await DbShoppingApp.shoppingItem.add({
      nome: 'teste item',
      shoppingId: listaInicio,
      valor: 10,
      itemMarcado: false,
      quantidade: 5,
      marca: ''
    })
  }
}
export const DbShoppingApp = new DbConfig();

